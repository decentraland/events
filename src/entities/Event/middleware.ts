import { Request } from 'express';
import isUUID from 'validator/lib/isUUID';
import EventModel from './model';
import { DeprecatedEventAttributes, EventAttributes, GetEventParams } from './types';
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin";
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { middleware } from "decentraland-gatsby/dist/entities/Route/handle";
import { createValidator } from 'decentraland-gatsby/dist/entities/Route/validate';
import { getEventParamsSchema } from './schemas';

export type WithEvent<R extends Request = Request> = R & {
  event: DeprecatedEventAttributes
}

export type WithEventOptions = {
  owner?: boolean
}

export const validateGetEventParams = createValidator<GetEventParams>(getEventParamsSchema)
export function withEvent(options: WithEventOptions = {}) {
  return middleware(async (req: Request) => {
    const user = (req as any).auth
    const params = validateGetEventParams(req.params)
    if (!isUUID(params.event_id)) {
      throw new RequestError(`Not found event "${params.event_id}"`, RequestError.NotFound)
    }

    const event = EventModel.build(await EventModel.findOne<EventAttributes>({ id: params.event_id }))
    if (!event) {
      throw new RequestError(`Not found event "${params.event_id}"`, RequestError.NotFound)
    }

    if (options.owner) {
      if (!user) {
        throw new RequestError(`Unauthorized`, RequestError.Unauthorized)
      }

      if (event.user !== user && !isAdmin(user)) {
        throw new RequestError(`Forbidden`, RequestError.Forbidden)
      }
    }

    return event
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