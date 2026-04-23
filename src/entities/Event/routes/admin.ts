import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import API from "decentraland-gatsby/dist/utils/api/API"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import Land from "decentraland-gatsby/dist/utils/api/Land"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"
import { Request } from "express"
import pick from "lodash/pick"

import Places from "../../../api/Places"
import EventCategoryModel from "../../EventCategory/model"
import { DEFAULT_PROFILE_SETTINGS } from "../../ProfileSettings/types"
import {
  notifyApprovedEvent,
  notifyEditedEvent,
  notifyRejectedEvent,
} from "../../Slack/utils"
import EventModel from "../model"
import { getEventParamsSchema, newEventSchema } from "../schemas"
import {
  DeprecatedEventAttributes,
  EventAttributes,
  EventListType,
  GetEventParams,
  MAX_EVENT_DURATION,
  MAX_RECURRENT_PAST_ITERATIONS,
  editEventAttributes,
} from "../types"
import {
  calculateRecurrentProperties,
  estimateRecurrentPastIterations,
  eventTargetUrl,
  validateImageUrl,
} from "../utils"

const DEFAULT_ADMIN_ACTOR = "jarvis-agent"
const MAX_REJECTION_REASON_LENGTH = 500
const MAX_ACTOR_LENGTH = 42

const EVENTS_BASE_URL = env(
  "EVENTS_BASE_URL",
  "https://events.decentraland.org"
)
const JUMP_IN_SITE_URL = env(
  "JUMP_IN_SITE_URL",
  "https://decentraland.org/jump"
)

const validateParams = createValidator<GetEventParams>(
  getEventParamsSchema as AjvObjectSchema
)
const validateUpdateEvent = createValidator<DeprecatedEventAttributes>(
  newEventSchema as AjvObjectSchema
)

const adminPatchEventAttributes = editEventAttributes.filter(
  (attribute) => attribute !== "rejected"
)

type AdminEventRequest = Request<
  { event_id: string },
  unknown,
  Record<string, unknown>
>
type AdminEventListRequest = Request<
  Record<string, never>,
  unknown,
  unknown,
  Record<string, string | string[] | undefined>
>

function bodyAsRecord(req: AdminEventRequest): Record<string, unknown> {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body
    : {}
}

function getActor(body: Record<string, unknown>): string {
  if (body.actor === undefined) {
    return DEFAULT_ADMIN_ACTOR
  }

  if (typeof body.actor !== "string") {
    throw new RequestError("actor must be a string", RequestError.BadRequest)
  }

  const actor = body.actor.trim()
  if (!actor) {
    throw new RequestError("actor cannot be empty", RequestError.BadRequest)
  }

  if (actor.length > MAX_ACTOR_LENGTH) {
    throw new RequestError(
      `actor must be ${MAX_ACTOR_LENGTH} characters or less`,
      RequestError.BadRequest
    )
  }

  return actor
}

function getRejectionReason(body: Record<string, unknown>): string {
  if (typeof body.reason !== "string") {
    throw new RequestError(
      "rejection reason is required",
      RequestError.BadRequest
    )
  }

  const reason = body.reason.trim()
  if (!reason) {
    throw new RequestError(
      "rejection reason cannot be empty",
      RequestError.BadRequest
    )
  }

  if (reason.length > MAX_REJECTION_REASON_LENGTH) {
    throw new RequestError(
      `rejection reason must be ${MAX_REJECTION_REASON_LENGTH} characters or less`,
      RequestError.BadRequest
    )
  }

  return reason
}

function toResponse(event: DeprecatedEventAttributes) {
  return EventModel.toPublic(event, {
    ...DEFAULT_PROFILE_SETTINGS,
    user: event.user,
  })
}

function parseBooleanQuery(
  value: string | string[] | undefined,
  field: string
): boolean | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === undefined) {
    return undefined
  }

  if (rawValue === "true" || rawValue === "1") {
    return true
  }

  if (rawValue === "false" || rawValue === "0") {
    return false
  }

  throw new RequestError(
    `${field} must be true or false`,
    RequestError.BadRequest
  )
}

async function getAdminEvent(req: AdminEventRequest) {
  const params = validateParams(req.params)
  const event = EventModel.build(
    await EventModel.findOne<EventAttributes>({ id: params.event_id })
  )

  if (!event) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  return event
}

async function persistEvent(
  event: DeprecatedEventAttributes,
  changes: Partial<DeprecatedEventAttributes>
) {
  await EventModel.update(changes, { id: event.id })
  return {
    ...event,
    ...changes,
  }
}

function buildApprovalChanges(
  event: DeprecatedEventAttributes,
  actor: string
): Partial<DeprecatedEventAttributes> | null {
  if (event.approved && !event.rejected && !event.rejection_reason) {
    return null
  }

  return {
    approved: true,
    approved_by: actor,
    rejected: false,
    rejected_by: null,
    rejection_reason: null,
  }
}

function buildRejectionChanges(
  event: DeprecatedEventAttributes,
  actor: string,
  reason: string
): Partial<DeprecatedEventAttributes> | null {
  if (event.rejected && event.rejection_reason === reason) {
    return null
  }

  return {
    approved: false,
    rejected: true,
    rejected_by: actor,
    rejection_reason: reason,
    highlighted: false,
    trending: false,
  }
}

export async function approveEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  const actor = getActor(bodyAsRecord(req))
  const changes = buildApprovalChanges(event, actor)

  if (!changes) {
    return toResponse(event)
  }

  const updatedEvent = await persistEvent(event, changes)
  await notifyApprovedEvent(updatedEvent)
  return toResponse(updatedEvent)
}

export async function getEventAdmin(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  return toResponse(event)
}

export async function getEventAdminList(req: AdminEventListRequest) {
  const approved = parseBooleanQuery(req.query.approved, "approved")
  const rejected = parseBooleanQuery(req.query.rejected, "rejected")
  const limit = req.query.limit
    ? Math.min(Math.max(Number(req.query.limit), 0), 500)
    : 100
  const offset = req.query.offset ? Math.max(Number(req.query.offset), 0) : 0

  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    throw new RequestError(
      "limit and offset must be valid numbers",
      RequestError.BadRequest
    )
  }

  if (limit === 0) {
    return []
  }

  const events = await EventModel.getEvents({
    allow_pending: true,
    include_rejected: true,
    approved,
    rejected,
    limit,
    offset,
    list: EventListType.All,
  })

  return events.map((event) => toResponse(event))
}

export async function unapproveEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)

  if (!event.approved && !event.approved_by) {
    return toResponse(event)
  }

  const updatedEvent = await persistEvent(event, {
    approved: false,
    approved_by: null,
  })

  return toResponse(updatedEvent)
}

export async function rejectEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  const body = bodyAsRecord(req)
  const actor = getActor(body)
  const reason = getRejectionReason(body)
  const changes = buildRejectionChanges(event, actor, reason)

  if (!changes) {
    return toResponse(event)
  }

  const updatedEvent = await persistEvent(event, changes)
  if (!event.rejected) {
    await notifyRejectedEvent(updatedEvent)
  }
  return toResponse(updatedEvent)
}

export async function unrejectEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)

  if (!event.rejected && !event.rejected_by && !event.rejection_reason) {
    return toResponse(event)
  }

  const updatedEvent = await persistEvent(event, {
    rejected: false,
    rejected_by: null,
    rejection_reason: null,
  })

  return toResponse(updatedEvent)
}

function validateAdminPatchBody(body: Record<string, unknown>) {
  const unsupportedFields = Object.keys(body).filter(
    (field) =>
      field !== "actor" &&
      !adminPatchEventAttributes.includes(
        field as (typeof adminPatchEventAttributes)[number]
      )
  )

  if (unsupportedFields.length > 0) {
    throw new RequestError(
      `Unsupported admin event fields: ${unsupportedFields.join(", ")}`,
      RequestError.BadRequest
    )
  }

  const patchFields = Object.keys(body).filter((field) => field !== "actor")
  if (patchFields.length === 0) {
    throw new RequestError(
      "At least one admin event field is required",
      RequestError.BadRequest
    )
  }
}

export async function patchEventAdmin(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  const body = bodyAsRecord(req)
  validateAdminPatchBody(body)

  const updatedAttributes = {
    ...pick(event, editEventAttributes),
    url: event.url,
    ...pick(body, adminPatchEventAttributes),
  } as DeprecatedEventAttributes

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

  const touchesRecurrence = [
    "start_at",
    "recurrent",
    "recurrent_frequency",
    "recurrent_interval",
    "recurrent_count",
    "recurrent_until",
  ].some((field) => body[field] !== undefined)
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

  if (body.image && body.image !== event.image) {
    await validateImageUrl(body.image as string)
  }

  if (body.image_vertical && body.image_vertical !== event.image_vertical) {
    await validateImageUrl(body.image_vertical as string)
  }

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

  const updatedEvent = {
    ...event,
    ...updatedAttributes,
  }

  updatedAttributes.textsearch = EventModel.textsearch(updatedEvent)
  const persistedEvent = await persistEvent(event, updatedAttributes)
  await notifyEditedEvent(persistedEvent)

  return toResponse(persistedEvent)
}
