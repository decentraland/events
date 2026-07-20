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
import Places from "../../../api/Places"
import EventAttendeeModel from "../../EventAttendee/model"
import { EventAttendeeAttributes } from "../../EventAttendee/types"
import EventCategoryModel from "../../EventCategory/model"
import {
  sendEventApproved,
  sendEventCreated,
  sendEventRejected,
} from "../../Notifications"
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
  MAX_RECURRENT_PAST_ITERATIONS,
  approveEventAttributes,
  editAnyEventAttributes,
  editEventAttributes,
  editEventAttributesWithoutRejected,
  editOwnEventAttributes,
} from "../types"
import {
  JUMP_IN_SITE_URL,
  calculateRecurrentProperties,
  estimateRecurrentPastIterations,
  eventTargetUrl,
  sanitizeEventDescription,
  validateImageUrl,
  validateRejectionReason,
} from "../utils"

const validateUpdateEvent = createValidator<DeprecatedEventAttributes>(
  newEventSchema as AjvObjectSchema
)

const EVENTS_BASE_URL = env(
  "EVENTS_BASE_URL",
  "https://events.decentraland.org"
)

// Owner-editable fields that are scheduling/control only: changing them
// doesn't alter what content is shown or where, so on their own they must
// NOT push an already-approved event back through moderation.
const NON_MODERATED_EDITABLE_FIELDS = new Set<string>([
  "start_at",
  "duration",
  "all_day",
  "recurrent",
  "recurrent_frequency",
  "recurrent_setpos",
  "recurrent_monthday",
  "recurrent_weekday_mask",
  "recurrent_month_mask",
  "recurrent_interval",
  "recurrent_count",
  "recurrent_until",
  "rejected",
])

// Public, creator-editable content/location fields whose change re-opens
// moderation — derived from the owner-editable surface minus the
// scheduling/control fields above (name, description, image, image_vertical,
// x, y, server, world, categories). Deriving it this way means any field
// later added to `editEventAttributes` re-moderates by default (fail-safe),
// and it closes the edit-after-approval bypass across the whole public
// surface, not just the description.
const MODERATED_CONTENT_FIELDS = editEventAttributes.filter(
  (field) => !NON_MODERATED_EDITABLE_FIELDS.has(field)
)

// Whether a moderated field's incoming request value differs from what the
// event currently holds. Compared against the raw request (not the enriched
// `updatedAttributes`) so server-maintained defaults — e.g. the world branch
// backfilling a missing image — never count as a user content change. The
// description is compared through the same sanitizer the API exposes, so a
// client round-tripping the already-sanitized text (identical on read and
// write) isn't mistaken for an edit. Arrays (categories) compare by value.
function isModeratedFieldChanged(
  field: string,
  next: unknown,
  current: unknown
): boolean {
  if (field === "description") {
    return (
      sanitizeEventDescription(String(next ?? "")) !==
      sanitizeEventDescription(String(current ?? ""))
    )
  }

  if (Array.isArray(next) || Array.isArray(current)) {
    const a = (Array.isArray(next) ? next : []).map(String).sort()
    const b = (Array.isArray(current) ? current : []).map(String).sort()
    return a.length !== b.length || a.some((value, index) => value !== b[index])
  }

  return next !== current
}

export type UpdateEventOptions = {
  event?: DeprecatedEventAttributes
  profile?: Awaited<ReturnType<typeof getAuthProfileSettings>>
  actor?: string
  admin?: boolean
}

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

  await sendEventCreated(event, communityMembersAttendees, {
    communityId: community.id,
    communityName: community.name,
    communityThumbnail: community.thumbnails?.raw,
  })
}

export async function updateEventWithOptions(
  req: WithAuthProfile<WithAuth>,
  options: UpdateEventOptions = {}
) {
  const user = options.actor || req.auth!
  const event = options.event || (await getEvent(req))
  const profile = options.profile || (await getAuthProfileSettings(req))
  const admin = !!options.admin
  const isOwner = event.user.toLowerCase() === user.toLowerCase()

  if (!admin && !isOwner && !isAdmin(user) && !canEditAnyEvent(profile)) {
    throw new RequestError(
      "You don't have permission to edit this event",
      RequestError.Forbidden
    )
  }

  const updatedAttributes = {
    ...pick(event, editEventAttributes),
  } as DeprecatedEventAttributes

  if (admin) {
    Object.assign(
      updatedAttributes,
      pick(req.body, editEventAttributesWithoutRejected),
      pick(event, editOwnEventAttributes),
      pick(req.body, editOwnEventAttributes),
      pick(event, editAnyEventAttributes),
      pick(req.body, editAnyEventAttributes)
    )
  } else if (isOwner) {
    Object.assign(
      updatedAttributes,
      pick(req.body, editEventAttributes),
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

  if (!admin && (isAdmin(user) || canEditAnyEvent(profile))) {
    Object.assign(
      updatedAttributes,
      pick(req.body, editEventAttributes),
      pick(event, editAnyEventAttributes),
      pick(req.body, editAnyEventAttributes)
    )
  }

  if (!admin && (isAdmin(user) || canApproveAnyEvent(profile))) {
    Object.assign(
      updatedAttributes,
      pick(event, approveEventAttributes),
      pick(req.body, approveEventAttributes)
    )

    if (req.body.rejection_reason !== undefined) {
      updatedAttributes.rejection_reason = validateRejectionReason(
        req.body.rejection_reason,
        "rejection_reason",
        { allowNull: true }
      )
    }
  }

  if (
    !updatedAttributes.url ||
    updatedAttributes.url.startsWith(JUMP_IN_SITE_URL)
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

  // Enforce the past-iteration cap only when this request actually
  // touches a recurrence-related field. A routine edit to name,
  // description, image, etc. of a grandfathered row whose start_at has
  // aged past the cap should not start failing as time moves forward.
  // Placed immediately after validateUpdateEvent so a rejected request
  // fails fast, before any downstream external API calls (Catalyst,
  // Land, Places, Communities).
  // weekday/month masks, monthday, and setpos are filters that don't
  // change rrule's iteration count — only which dates it emits — so
  // they're intentionally excluded.
  const touchesRecurrence = [
    "start_at",
    "recurrent",
    "recurrent_frequency",
    "recurrent_interval",
    "recurrent_count",
    "recurrent_until",
  ].some((field) => req.body[field] !== undefined)
  if (
    touchesRecurrence &&
    updatedAttributes.recurrent &&
    estimateRecurrentPastIterations(updatedAttributes) >
      MAX_RECURRENT_PAST_ITERATIONS
  ) {
    throw new RequestError(
      `Recurrence rule expands to too many past occurrences from the start date; choose a later start date or a coarser frequency`,
      RequestError.BadRequest,
      { body: updatedAttributes }
    )
  }

  if (req.body.image && req.body.image !== event.image) {
    await validateImageUrl(req.body.image)
  }

  if (
    req.body.image_vertical &&
    req.body.image_vertical !== event.image_vertical
  ) {
    await validateImageUrl(req.body.image_vertical)
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

  // Re-queue an already-approved event for moderation whenever its
  // content changes, unless the actor is authorized to approve — a
  // moderator's edit is itself a review. Closes the edit-after-approval
  // bypass where an owner could get a benign event approved and then edit
  // in content that stayed live without re-review.
  const actorCanApprove =
    admin ||
    isAdmin(user) ||
    canApproveAnyEvent(profile) ||
    (isOwner && canApproveOwnEvent(profile))
  const requestBody = req.body as Record<string, unknown>
  const moderatedContentChanged = MODERATED_CONTENT_FIELDS.some(
    (field) =>
      field in requestBody &&
      isModeratedFieldChanged(
        field,
        requestBody[field],
        event[field as keyof EventAttributes]
      )
  )
  if (event.approved && moderatedContentChanged && !actorCanApprove) {
    updatedAttributes.approved = false
    updatedAttributes.approved_by = null
    updatedAttributes.highlighted = false
    updatedAttributes.trending = false
  }

  const updatedEvent: DeprecatedEventAttributes & { attending?: boolean } = {
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

  // Community validation is only needed if the event is being updated by the owner
  const needsCommunityValidation = updatedAttributes.community_id !== undefined

  if (!admin && needsCommunityValidation) {
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
        await notifyCommunityMembers(updatedEvent, community)
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

  if (!admin) {
    const attendee = await EventAttendeeModel.findOne<EventAttendeeAttributes>({
      event_id: event.id,
      user,
    })

    updatedEvent.attending = !!attendee
  }

  if (admin) {
    notifyEditedEvent(updatedEvent)
  } else if (!event.approved && updatedEvent.approved) {
    notifyApprovedEvent(updatedEvent)
    await sendEventApproved(updatedEvent)
  } else if (!event.rejected && updatedEvent.rejected) {
    notifyRejectedEvent(updatedEvent)
    await sendEventRejected(updatedEvent, updatedEvent.rejection_reason || "")
  } else if (updatedEvent.user === user) {
    notifyEditedEvent(updatedEvent)
  }

  return EventModel.toPublic(updatedEvent, profile)
}

export async function updateEvent(req: WithAuthProfile<WithAuth>) {
  return updateEventWithOptions(req)
}
