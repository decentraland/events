import { Request } from 'express';
import isUUID from 'validator/lib/isUUID';
import EventModel from './model';
import { DeprecatedEventAttributes, EventAttributes } from './types';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { middleware } from "decentraland-gatsby/dist/entities/Route/handle";
import isAdmin from '../Auth/isAdmin';

export type WithEvent<R extends Request = Request> = R & {
  event: DeprecatedEventAttributes
}

export type WithEventOptions = {
  owner?: boolean,
  enforce?: Partial<EventAttributes>
}

export function withEvent(options: WithEventOptions = {}) {
  return middleware(async (req: Request<{ eventId: string }>) => {
    const user = (req as any).auth
    const event_id = req.params.eventId
    const event = await requireEvent(event_id, options.enforce)

    if (options.owner) {
      if (!user) {
        throw new RequestError(`Unauthorized`, RequestError.Unauthorized)
      }

      if (event.user !== user && !isAdmin(user)) {
        throw new RequestError(`Forbidden`, RequestError.Forbidden)
      }
    }

    Object.assign(req, { event })
  })
}

export async function requireEvent(event_id: string, enforce: Partial<EventAttributes> = {}) {
    if (!isUUID(event_id)) {
      throw new RequestError(`Not found event "${event_id}"`, RequestError.NotFound)
    }

    const event = EventModel.build(await EventModel.findOne<EventAttributes>({ id: event_id, ...enforce }))
    if (!event) {
      throw new RequestError(`Not found event "${event_id}"`, RequestError.NotFound)
    }

    return event
}