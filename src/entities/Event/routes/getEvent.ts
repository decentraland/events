import EventModel from '../model';
import EventAttendee from '../../EventAttendee/model';
import { validateGetEventParams } from '../middleware';
import isUUID from 'validator/lib/isUUID';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { EventAttributes, SessionEventAttributes } from '../types';
import isAdmin from 'decentraland-gatsby/dist/entities/Auth/isAdmin';
import { Request } from 'express';

type WithEvent = {
  event?: SessionEventAttributes
}

type WithAuth = {
  auth?: string
}

export async function getEvent(req: Request & WithAuth & WithEvent) {
  if (req.event) {
    return req.event
  }

  const user = req.auth
  const params = validateGetEventParams(req.params)
  if (!isUUID(params.event_id)) {
    throw EventNotFoundError(params.event_id)
  }

  const event = EventModel.build(await EventModel.findOne<EventAttributes>({ id: params.event_id }))
  if (!event) {
    throw EventNotFoundError(params.event_id)
  }

  if (!event.approved) {
    if (!user) {
      throw EventNotFoundError(params.event_id)
    }

    if (event.user !== user && !isAdmin(user)) {
      throw EventNotFoundError(params.event_id)
    }
  }

  let attending = false;
  if (user) {
    attending = !!(await EventAttendee.count({ user, event_id: params.event_id }));
  }

  const publicEvent = { ...EventModel.toPublic(event, req.auth), attending }
  req.event = publicEvent
  return publicEvent
}

function EventNotFoundError(event_id: string) {
  return new RequestError(`Not found event "${event_id}"`, RequestError.NotFound)
}