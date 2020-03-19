import { utils } from 'decentraland-commons';
import env from 'decentraland-gatsby/dist/utils/env'
import uuid from 'uuid/v4';
import Event from './model';
import routes from "../Route/routes";
import EventAttendee from '../EventAttendee/model';
import RequestError from '../Route/error';
import { auth, WithAuth } from '../Auth/middleware';
import { EventAttributes, adminPatchAttributes, patchAttributes } from './types';
import { withEvent, WithEvent } from './middleware';
import isAdmin from '../Auth/isAdmin';
import handle from '../Route/handle';
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst';
import { SQL, raw } from 'decentraland-server';

const LAND_URL = env('LAND_URL', '')
export const BASE_PATH = '/events/:eventId'

export default routes((router) => {

  const withAuth = auth({ optional: true })
  const withOptionalAuth = auth({ optional: true })
  const withEventExists = withEvent()
  const withEventOwner = withEvent({ owner: true })

  router.get('/events', withOptionalAuth, handle(listEvents))
  router.post('/events', withAuth, handle(createNewEvent))
  router.get('/events/attending', withAuth, handle(getAttendingEvents))
  router.get(BASE_PATH, withOptionalAuth, withEventExists, handle(getEvent))
  router.patch(BASE_PATH, withAuth, withEventOwner, handle(updateEvent))
})

export async function listEvents(req: WithAuth) {
  const query = SQL`
    SELECT *
    FROM ${raw(Event.tableName)}
    WHERE finish_at > now()
    AND approved IS TRUE
    ORDER BY start_at ASC
  `
  const events = await Event.query<EventAttributes>(query)
  return events.map((event) => Event.toPublic(event, req.auth))
}

export async function getEvent(req: WithAuth<WithEvent>) {
  const user = req.auth
  const event = req.event
  const [total_attendees, latest_attendees] = await Promise.all([
    EventAttendee.count({ event_id: event.id }),
    EventAttendee.latest(event.id),
  ] as const)

  let attending = false
  if (user) {
    attending = (await EventAttendee.count({ user })) > 0
  }

  return { ...Event.toPublic(event), attending, total_attendees, latest_attendees }
}

export async function getAttendingEvents(req: WithAuth) {
  const events = await Event.getAttending(req.auth!)
  return events.map((event) => Event.toPublic(event, req.auth))
}

export async function createNewEvent(req: WithAuth) {
  const user = req.auth!
  const now = new Date()

  const errors = Event.validate(req.body)
  if (errors) {
    throw new RequestError('Invalid event data', RequestError.StatusCode.BadRequest, errors)
  }

  const event_id = uuid()
  const data = req.body as EventAttributes
  const [x, y] = data.coordinates

  const event: EventAttributes = {
    ...data,
    id: event_id,
    image: `${LAND_URL}/parcels/${x}/${y}/map.png`,
    user,
    approved: false,
    created_at: now
  }

  await Event.create(event)
  return event
}

export async function updateEvent(req: WithAuth<WithEvent>) {
  const user = req.auth!
  const attributes = isAdmin(user) ? adminPatchAttributes : patchAttributes
  const updatedAttributes = {
    ...utils.pick(req.event, attributes),
    ...utils.pick(req.body, attributes)
  } as EventAttributes

  const errors = Event.validate(updatedAttributes)
  if (errors) {
    throw new RequestError('Invalid event data', RequestError.StatusCode.BadRequest, errors)
  }

  await Event.update(updatedAttributes, { id: req.event.id })

  return { ...req.event, ...updatedAttributes }
}