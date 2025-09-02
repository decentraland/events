import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import API from "decentraland-gatsby/dist/utils/api/API"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import Land from "decentraland-gatsby/dist/utils/api/Land"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"
import pick from "lodash/pick"

import { getEvent } from "./getEvent"
import Communities, { CommunityAttributes } from "../../../api/Communities"
import Notifications from "../../../api/Notifications"
import Places from "../../../api/Places"
import EventAttendeeModel from "../../EventAttendee/model"
import { EventAttendeeAttributes } from "../../EventAttendee/types"
import EventCategoryModel from "../../EventCategory/model"
import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import {
  canApproveAnyEvent,
  canApproveOwnEvent,
  canEditAnyEvent,
} from "../../ProfileSettings/utils"
import ScheduleModel from "../../Schedule/model"
import { getMissingSchedules } from "../../Schedule/utils"
import {
  notifyApprovedEvent,
  notifyEditedEvent,
  notifyRejectedEvent,
} from "../../Slack/utils"
import EventModel from "../model"
import { newEventSchema } from "../schemas"
import {
  DeprecatedEventAttributes,
  EventAttributes,
  MAX_EVENT_DURATION,
  approveEventAttributes,
  editAnyEventAttributes,
  editEventAttributes,
  editOwnEventAttributes,
} from "../types"
import {
  calculateRecurrentProperties,
  eventTargetUrl,
  validateImageUrl,
} from "../utils"

import { DECENTRALAND_URL } from "./index"

const validateUpdateEvent = createValidator<DeprecatedEventAttributes>(
  newEventSchema as AjvObjectSchema
)

const EVENTS_BASE_URL = env(
  "EVENTS_BASE_URL",
  "https://events.decentraland.org"
)

async function notifyCommunityMembers(
  event: EventAttributes,
  community: CommunityAttributes
) {
  const communityMembers = await Communities.get().getCommunityMembers(
    community.id
  )

  const communityMembersAttendees = communityMembers.map((member) => ({
    event_id: event.id,
    user: member.memberAddress,
    user_name: member.name || "",
    created_at: new Date(),
  }))

  await Notifications.get().sendEventCreated(event, communityMembersAttendees, {
    communityId: community.id,
    communityName: community.name,
    communityThumbnail: community.thumbnails?.raw,
  })
}

export async function updateEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const event = await getEvent(req)
  const profile = await getAuthProfileSettings(req)
  const updatedAttributes = {
    ...pick(event, editEventAttributes),
    ...pick(req.body, editEventAttributes),
  } as DeprecatedEventAttributes

  const approvalOnlyFields = [
    "approved",
    "rejected",
    "approved_by",
    "rejected_by",
  ]
  const modifiedFields = Object.keys(req.body)
  const isApprovalOnlyUpdate =
    modifiedFields.length > 0 &&
    modifiedFields.every((field) => approvalOnlyFields.includes(field))

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

  if (req.body.image && req.body.image !== event.image) {
    await validateImageUrl(req.body.image)
  }

  // make schedules unique
  if (updatedAttributes.schedules) {
    updatedAttributes.schedules = Array.from(
      new Set(updatedAttributes.schedules)
    )
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
  }

  /**
   * Verify that the duration event is not longer than the max allowed or the previous duration
   */
  if (
    updatedAttributes.duration &&
    updatedAttributes.duration > Math.max(event.duration, MAX_EVENT_DURATION)
  ) {
    throw new RequestError(
      `Maximum allowed duration ${MAX_EVENT_DURATION / Time.Hour}Hrs`,
      RequestError.BadRequest,
      { body: updatedAttributes }
    )
  }

  const userProfiles = await Catalyst.getInstance().getProfiles([event.user])
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
  if (updatedAttributes.categories.length) {
    const validation = await EventCategoryModel.validateCategories(
      updatedAttributes.categories
    )
    if (!validation) {
      throw new RequestError(
        `Invalid category tag supplied`,
        RequestError.BadRequest,
        { body: event }
      )
    }
  }

  // Update data from worlds
  const tile = await API.catch(Land.getInstance().getTile([x, y]))
  updatedAttributes.coordinates = [x, y]

  if (!updatedAttributes.world) {
    const place = await Places.get().getPlaceByPosition(`${x},${y}`)
    updatedAttributes.estate_id = tile?.estateId || updatedAttributes.estate_id
    updatedAttributes.estate_name = tile?.name || updatedAttributes.estate_name
    updatedAttributes.scene_name = updatedAttributes.estate_name
    updatedAttributes.place_id = place?.id || updatedAttributes.place_id
  } else {
    const world = await Places.get().getWorldByName(updatedAttributes.server!)
    updatedAttributes.image =
      updatedAttributes.image || `${EVENTS_BASE_URL}/images/event-default.jpg`
    updatedAttributes.place_id = world?.id || updatedAttributes.place_id
  }

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
  if (!event.approved && updatedEvent.approved) {
    updatedEvent.approved_by = user
    updatedAttributes.approved_by = user
  } else if (!event.rejected && updatedEvent.rejected) {
    updatedEvent.rejected_by = user
    updatedAttributes.rejected_by = user
  }

  // Determine if we need to validate community ownership
  // Skip validation for approval-only updates since those are administrative actions
  // that shouldn't require community management permissions
  const needsCommunityValidation =
    !isApprovalOnlyUpdate &&
    // Case 1: Community ID is being set to a specific community (not null/detachment)
    ((req.body.community_id !== undefined && req.body.community_id !== null) ||
      // Case 2: Event has existing community, not being detached, and non-approval fields are being modified
      (event.community_id &&
        req.body.community_id !== null &&
        modifiedFields.some((field) => !approvalOnlyFields.includes(field))))

  if (needsCommunityValidation) {
    try {
      const userCommunities = await Communities.get().getCommunitiesWithToken(
        user
      )

      // Determine which community to validate against
      const communityToValidate =
        req.body.community_id !== undefined
          ? req.body.community_id === null
            ? event.community_id
            : req.body.community_id
          : event.community_id

      if (communityToValidate) {
        const community = userCommunities.find(
          (c) => c.id === communityToValidate
        )

        if (!community) {
          const action =
            req.body.community_id === null ? "detach this event from" : "access"
          throw new RequestError(
            `Community "${communityToValidate}" not found or you don't have permission to ${action} it`,
            RequestError.BadRequest,
            { body: updatedAttributes }
          )
        }
      }
    } catch (error) {
      throw new RequestError(
        `Failed to validate community ownership: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        RequestError.BadRequest,
        { body: updatedEvent }
      )
    }
  }

  await EventModel.update(updatedAttributes, { id: event.id })

  // Notify community members when:
  // 1. Event is approved AND has a community
  // 2. Event is being approved for the first time OR community is changing to a new one
  // 3. Community is not being explicitly removed (req.body.community_id !== null)
  const shouldNotify =
    updatedAttributes.approved && // Event is approved
    updatedAttributes.community_id && // Event has a community
    req.body.community_id !== null && // Community is not being explicitly removed
    (!event.approved || // Event is being approved for the first time
      (event.approved && updatedAttributes.community_id !== event.community_id)) // OR event was already approved but community changed

  if (shouldNotify) {
    try {
      const community = await Communities.get().getCommunity(
        updatedAttributes.community_id!
      )

      if (community) {
        console.log(
          "Sending community notification for community:",
          community.name
        )
        // do not fail the event update if the notification fails
        await notifyCommunityMembers(updatedEvent, community).catch((error) => {
          console.error("Failed to send community notification:", error)
        })
      } else {
        console.log(
          "Community not found for notification:",
          updatedAttributes.community_id
        )
      }
    } catch (error) {
      console.error("Error while sending community notification:", error)
    }
  }

  const attendee = await EventAttendeeModel.findOne<EventAttendeeAttributes>({
    event_id: event.id,
    user,
  })

  updatedEvent.attending = !!attendee

  if (!event.approved && updatedEvent.approved) {
    notifyApprovedEvent(updatedEvent)
  } else if (!event.rejected && updatedEvent.rejected) {
    notifyRejectedEvent(updatedEvent)
  } else if (updatedEvent.user === user) {
    notifyEditedEvent(updatedEvent)
  }

  return EventModel.toPublic(updatedEvent, profile)
}
