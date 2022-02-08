import { utils } from "decentraland-commons"
import { isInsideWorldLimits } from "@dcl/schemas"
import Land from "decentraland-gatsby/dist/utils/api/Land"
import EventModel from "../model"
import { eventTargetUrl, calculateRecurrentProperties } from "../utils"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import {
  adminPatchAttributes,
  patchAttributes,
  DeprecatedEventAttributes,
  EventAttributes,
} from "../types"
import { WithEvent } from "../middleware"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import { notifyApprovedEvent, notifyEditedEvent } from "../../Slack/utils"
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

const validateUpdateEvent = createValidator<DeprecatedEventAttributes>(
  newEventSchema as AjvObjectSchema
)
export async function updateEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const event = await getEvent(req)
  const attributes = isAdmin(user) ? adminPatchAttributes : patchAttributes
  let updatedAttributes = {
    ...utils.pick(event, attributes),
    ...utils.pick(req.body, attributes),
  } as DeprecatedEventAttributes

  if (
    !updatedAttributes.url ||
    updatedAttributes.url.startsWith(DECENTRALAND_URL)
  ) {
    updatedAttributes.url = eventTargetUrl(updatedAttributes)
  }

  updatedAttributes = validateUpdateEvent({
    ...updatedAttributes,
    start_at: Time.date(updatedAttributes.start_at)?.toJSON(),
    recurrent_until: Time.date(updatedAttributes.recurrent_until)?.toJSON(),
  })

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
  } else if (!isAdmin(user)) {
    notifyEditedEvent(updatedEvent)
  }

  return EventModel.toPublic(updatedEvent, user)
}
