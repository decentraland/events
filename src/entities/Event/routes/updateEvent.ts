import pick from "lodash/pick"
import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import Land from "decentraland-gatsby/dist/utils/api/Land"
import EventModel from "../model"
import { eventTargetUrl, calculateRecurrentProperties } from "../utils"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import {
  editAnyEventAttributes,
  editOwnEventAttributes,
  DeprecatedEventAttributes,
  MAX_EVENT_DURATION,
  editEventAttributes,
  approveEventAttributes,
} from "../types"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import {
  notifyApprovedEvent,
  notifyEditedEvent,
  notifyRejectedEvent,
} from "../../Slack/utils"
import EventAttendeeModel from "../../EventAttendee/model"
import { EventAttendeeAttributes } from "../../EventAttendee/types"
import API from "decentraland-gatsby/dist/utils/api/API"
import { DECENTRALAND_URL } from "./index"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { newEventSchema } from "../schemas"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import { getEvent } from "./getEvent"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import EventCategoryModel from "../../EventCategory/model"
import { getMissingSchedules } from "../../Schedule/utils"
import { getMyProfileSettings } from "../../ProfileSettings/routes/getMyProfileSettings"
import {
  canApproveAnyEvent,
  canApproveOwnEvent,
  canEditAnyEvent,
} from "../../ProfileSettings/utils"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import ScheduleModel from "../../Schedule/model"

const validateUpdateEvent = createValidator<DeprecatedEventAttributes>(
  newEventSchema as AjvObjectSchema
)

export async function updateEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const event = await getEvent(req)
  const profile = await getMyProfileSettings(req)
  const updatedAttributes = {
    ...pick(event, editEventAttributes),
    ...pick(req.body, editEventAttributes),
  } as DeprecatedEventAttributes

  if (event.user === user) {
    Object.assign(
      updatedAttributes,
      pick(event, editOwnEventAttributes),
      pick(req.body, editOwnEventAttributes)
    )

    if (isAdmin(user) || canApproveOwnEvent(profile)) {
      Object.assign(
        updatedAttributes,
        pick(event, approveEventAttributes),
        pick(req.body, approveEventAttributes)
      )
    }
  }

  if (isAdmin(user) || canEditAnyEvent(profile)) {
    Object.assign(
      updatedAttributes,
      pick(event, editAnyEventAttributes),
      pick(req.body, editAnyEventAttributes)
    )
  }

  if (isAdmin(user) || canApproveAnyEvent(profile)) {
    Object.assign(
      updatedAttributes,
      pick(event, approveEventAttributes),
      pick(req.body, approveEventAttributes)
    )
  }

  if (
    !updatedAttributes.url ||
    updatedAttributes.url.startsWith(DECENTRALAND_URL)
  ) {
    updatedAttributes.url = eventTargetUrl(updatedAttributes)
  }

  updatedAttributes.start_at = Time.date(updatedAttributes.start_at)
  updatedAttributes.recurrent_until = Time.date(
    updatedAttributes.recurrent_until
  )

  validateUpdateEvent({
    ...updatedAttributes,
    start_at: Time.date(updatedAttributes.start_at)?.toJSON(),
    recurrent_until: Time.date(updatedAttributes.recurrent_until)?.toJSON(),
  })

  // make schedules unique
  updatedAttributes.schedules = Array.from(new Set(updatedAttributes.schedules))
  if (updatedAttributes.schedules.length > 0) {
    const schedules = await ScheduleModel.getScheduleList(
      updatedAttributes.schedules
    )
    const missingSchedules = getMissingSchedules(
      schedules,
      updatedAttributes.schedules
    )
    if (missingSchedules.length > 0) {
      throw new RequestError(
        `Schedule not found: ${missingSchedules.join(", ")}`,
        RequestError.BadRequest,
        { body: updatedAttributes }
      )
    }
  }

  /**
   * Verify that the duration event is not longer than the max allowed or the previous duration
   */
  if (
    updatedAttributes.duration > Math.max(event.duration, MAX_EVENT_DURATION)
  ) {
    throw new RequestError(
      `Maximum allowed duration ${MAX_EVENT_DURATION / Time.Hour}Hrs`,
      RequestError.BadRequest,
      { body: updatedAttributes }
    )
  }

  const userProfiles = await Catalyst.get().getProfiles([event.user])
  if (
    userProfiles &&
    userProfiles[0] &&
    userProfiles[0].name &&
    event.user_name !== userProfiles[0].name
  ) {
    updatedAttributes.user_name = userProfiles[0].name
  }

  const x = updatedAttributes.x
  const y = updatedAttributes.y
  if (!isInsideWorldLimits(x, y)) {
    throw new RequestError(
      `Event is outside the world limits`,
      RequestError.BadRequest,
      { body: updatedAttributes }
    )
  }

  /**
   * Verify categories actually exist
   */
  if (event.categories.length) {
    const validation = await EventCategoryModel.validateCategories(
      event.categories
    )
    if (!validation) {
      throw new RequestError(
        `Invalid category tag supplied`,
        RequestError.BadRequest,
        { body: event }
      )
    }
  }

  const tile = await API.catch(Land.get().getTile([x, y]))
  updatedAttributes.estate_id = tile?.estateId || updatedAttributes.estate_id
  updatedAttributes.estate_name = tile?.name || updatedAttributes.estate_name
  updatedAttributes.scene_name = updatedAttributes.estate_name
  updatedAttributes.coordinates = [x, y]

  Object.assign(
    updatedAttributes,
    calculateRecurrentProperties(updatedAttributes)
  )

  updatedAttributes.next_start_at = EventModel.selectNextStartAt(
    updatedAttributes.duration,
    updatedAttributes.start_at,
    updatedAttributes.recurrent_dates
  )

  updatedAttributes.next_finish_at = new Date(
    updatedAttributes.next_start_at.getTime() + updatedAttributes.duration
  )

  if (updatedAttributes.rejected) {
    updatedAttributes.rejected = true
    updatedAttributes.approved = false
    updatedAttributes.highlighted = false
    updatedAttributes.trending = false
  }

  const updatedEvent = {
    ...event,
    ...updatedAttributes,
  }

  updatedAttributes.textsearch = EventModel.textsearch(updatedEvent)
  await EventModel.update(updatedAttributes, { id: event.id })

  const attendee = await EventAttendeeModel.findOne<EventAttendeeAttributes>({
    event_id: event.id,
    user,
  })

  updatedEvent.attending = !!attendee
  updatedEvent.notify = !!attendee?.notify

  if (!event.approved && updatedEvent.approved) {
    notifyApprovedEvent(updatedEvent)
  } else if (!event.rejected && updatedEvent.rejected) {
    notifyRejectedEvent(updatedEvent)
  } else if (updatedEvent.user === user) {
    notifyEditedEvent(updatedEvent)
  }

  return EventModel.toPublic(updatedEvent, profile)
}
