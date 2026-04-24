import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import { Request } from "express"

import { DEFAULT_PROFILE_SETTINGS } from "../../ProfileSettings/types"
import { notifyApprovedEvent, notifyRejectedEvent } from "../../Slack/utils"
import EventModel from "../model"
import { getEventParamsSchema } from "../schemas"
import {
  DeprecatedEventAttributes,
  EventAttributes,
  GetEventParams,
  MAX_ADMIN_ACTOR_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
  editAnyEventAttributes,
  editEventAttributes,
  editOwnEventAttributes,
} from "../types"
import { updateEventWithOptions } from "./updateEvent"

const DEFAULT_ADMIN_ACTOR = "jarvis-agent"

const validateParams = createValidator<GetEventParams>(
  getEventParamsSchema as AjvObjectSchema
)

const adminPatchEventAttributes = [
  ...editEventAttributes.filter((attribute) => attribute !== "rejected"),
  ...editOwnEventAttributes,
  ...editAnyEventAttributes,
]

const STATE_ONLY_FIELDS = new Set(["actor", "approved", "rejected", "reason"])

type AdminEventRequest = Request<
  { event_id: string },
  unknown,
  Record<string, unknown>
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

  if (actor.length > MAX_ADMIN_ACTOR_LENGTH) {
    throw new RequestError(
      `actor must be ${MAX_ADMIN_ACTOR_LENGTH} characters or less`,
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
    approved_by: null,
    rejected: true,
    rejected_by: actor,
    rejection_reason: reason,
    highlighted: false,
    trending: false,
  }
}

async function approveEventByActor(
  event: DeprecatedEventAttributes,
  actor: string
) {
  const changes = buildApprovalChanges(event, actor)

  if (!changes) {
    return toResponse(event)
  }

  const updatedEvent = await persistEvent(event, changes)
  await notifyApprovedEvent(updatedEvent)
  return toResponse(updatedEvent)
}

async function unapproveEventByActor(event: DeprecatedEventAttributes) {
  if (!event.approved && !event.approved_by) {
    return toResponse(event)
  }

  const updatedEvent = await persistEvent(event, {
    approved: false,
    approved_by: null,
  })

  return toResponse(updatedEvent)
}

async function rejectEventByActor(
  event: DeprecatedEventAttributes,
  actor: string,
  reason: string
) {
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

async function unrejectEventByActor(event: DeprecatedEventAttributes) {
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

function isStateOnlyBody(body: Record<string, unknown>): boolean {
  const fields = Object.keys(body)
  if (fields.length === 0) return false
  return fields.every((field) => STATE_ONLY_FIELDS.has(field))
}

function getBooleanField(
  body: Record<string, unknown>,
  field: string
): boolean | undefined {
  if (!(field in body)) return undefined
  const value = body[field]
  if (typeof value !== "boolean") {
    throw new RequestError(
      `${field} must be a boolean`,
      RequestError.BadRequest
    )
  }
  return value
}

async function applyStateChange(
  event: DeprecatedEventAttributes,
  body: Record<string, unknown>
) {
  const approved = getBooleanField(body, "approved")
  const rejected = getBooleanField(body, "rejected")

  if (approved !== undefined && rejected !== undefined) {
    throw new RequestError(
      "approved and rejected cannot be set in the same request",
      RequestError.BadRequest
    )
  }

  const actor = getActor(body)

  if (approved === true) {
    return approveEventByActor(event, actor)
  }
  if (approved === false) {
    return unapproveEventByActor(event)
  }
  if (rejected === true) {
    const reason = getRejectionReason(body)
    return rejectEventByActor(event, actor, reason)
  }
  if (rejected === false) {
    return unrejectEventByActor(event)
  }

  throw new RequestError(
    "approved or rejected field is required",
    RequestError.BadRequest
  )
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

export async function approveEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  const actor = getActor(bodyAsRecord(req))
  return approveEventByActor(event, actor)
}

export async function unapproveEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  return unapproveEventByActor(event)
}

export async function rejectEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  const body = bodyAsRecord(req)
  const actor = getActor(body)
  const reason = getRejectionReason(body)
  return rejectEventByActor(event, actor, reason)
}

export async function unrejectEvent(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  return unrejectEventByActor(event)
}

export async function patchEventAdmin(req: AdminEventRequest) {
  const event = await getAdminEvent(req)
  const body = bodyAsRecord(req)

  if (isStateOnlyBody(body)) {
    return applyStateChange(event, body)
  }

  validateAdminPatchBody(body)
  const actor = getActor(body)

  return updateEventWithOptions(
    req as unknown as Parameters<typeof updateEventWithOptions>[0],
    {
      admin: true,
      actor,
      event,
      profile: {
        ...DEFAULT_PROFILE_SETTINGS,
        subscriptions: [],
        user: event.user,
      },
    }
  )
}
