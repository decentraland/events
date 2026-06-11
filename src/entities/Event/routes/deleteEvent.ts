import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import isUUID from "validator/lib/isUUID"

import { sendEventDeleted } from "../../Notifications"
import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import { canEditAnyEvent } from "../../ProfileSettings/utils"
import { notifyDeletedEvent } from "../../Slack/utils"
import EventModel from "../model"
import { validateGetEventParams } from "./getEvent"
import { DeprecatedEventAttributes, EventAttributes } from "../types"
import { validateDeletedReason } from "../utils"

/**
 * Soft-deletes an event. The delete is terminal: a deleted event cannot be
 * restored. The actor decides which flag is set:
 * - the creator deleting their own event -> `deleted_by_user` (no notification)
 * - an admin/editor deleting someone else's event -> `deleted_by_admin`,
 *   notifying the creator (Slack + push).
 */
export async function deleteEvent(req: WithAuth) {
  const user = req.auth!
  const params = validateGetEventParams(req.params)

  if (!isUUID(params.event_id)) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  const event = EventModel.build(
    await EventModel.findOne<EventAttributes>({ id: params.event_id })
  ) as DeprecatedEventAttributes

  if (!event) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  const profile = await getAuthProfileSettings(req)
  const isOwner = event.user.toLowerCase() === user.toLowerCase()

  if (!isOwner && !isAdmin(user) && !canEditAnyEvent(profile)) {
    throw new RequestError(
      "You don't have permission to delete this event",
      RequestError.Forbidden
    )
  }

  // Already deleted: terminal state, respond idempotently.
  if (event.deleted_by_user || event.deleted_by_admin) {
    return EventModel.toPublic(event, profile)
  }

  const deletedAt = new Date()
  let changes: Partial<DeprecatedEventAttributes>

  if (isOwner) {
    changes = {
      deleted_by_user: true,
      deleted_by: user,
      deleted_at: deletedAt,
    }
  } else {
    const reason = validateDeletedReason(
      (req.body as { reason?: unknown })?.reason
    )
    changes = {
      deleted_by_admin: true,
      deleted_by: user,
      deleted_at: deletedAt,
      deleted_reason: reason,
    }
  }

  await EventModel.update(changes, { id: event.id })
  const updatedEvent = { ...event, ...changes }

  if (!isOwner) {
    await notifyDeletedEvent(updatedEvent)
    await sendEventDeleted(
      updatedEvent,
      updatedEvent.deleted_reason || undefined
    )
  }

  return EventModel.toPublic(updatedEvent, profile)
}
