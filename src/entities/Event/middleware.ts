import { Request } from 'express';
import isUUID from 'validator/lib/isUUID';
import param from 'decentraland-gatsby/dist/entities/Route/param';
import { DeprecatedEventAttributes, EventAttributes } from './types';
import EventModel from './model';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { middleware } from "decentraland-gatsby/dist/entities/Route/handle";
import isAdmin from '../Auth/isAdmin';

export type WithEvent<R extends Request = Request> = R & {
  event: DeprecatedEventAttributes
}

export type WithEventOptions = {
  owner?: boolean,
  enforce?: { [key: string]: any }
}

export function withEvent(options: WithEventOptions = {}) {
  return middleware(async (req: Request<{ eventId: string }>) => {
    const event_id = req.params.eventId
    if (!isUUID(event_id)) {
      throw new RequestError(`Not found event "${event_id}"`, RequestError.NotFound)
    }

    const enforce = options.enforce || {}
    const event = EventModel.build(await EventModel.findOne<EventAttributes>({ id: event_id, ...enforce }))
    if (!event) {
      throw new RequestError(`Not found event "${event_id}"`, RequestError.NotFound)
    }

    if (options.owner) {
      const user = (req as any).auth

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
