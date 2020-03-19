import { Request } from 'express';
import routes from "../Route/routes";
import EventAttendee from '../EventAttendee/model';
import { auth, WithAuth } from '../Auth/middleware';
import { BASE_PATH } from '../Event/routes';
import { getEventIdParam } from "../Event/middleware";
import { EventAttendeeAttributes } from './types';
import handle from '../Route/handle';

export default routes((router) => {

  const withAuth = auth({ optional: true })
  // const withAuthOptional = auth({ optional: true })

  router.get(BASE_PATH + '/attendees', handle(getEventAttendees))
  router.post(BASE_PATH + '/attendees', withAuth, handle(createEventAttendee))
  router.delete(BASE_PATH + '/attendees')
})

export async function getEventAttendeeList(event_id: string) {
  const attendees = await EventAttendee.find<EventAttendeeAttributes>({ event_id })
  return attendees.map(attendee => attendee.user)
}

export async function getEventAttendees(req: Request) {
  const event_id = getEventIdParam(req)
  return getEventAttendeeList(event_id)
}

export async function createEventAttendee(req: WithAuth) {
  const user = req.auth!
  const event_id = getEventIdParam(req)
  await EventAttendee.create<EventAttendeeAttributes>({ event_id, user, created_at: new Date() })

  return getEventAttendeeList(event_id)
}

export async function deleteEventAttendee(req: WithAuth) {
  const user = req.auth!
  const event_id = getEventIdParam(req)
  await EventAttendee.delete<EventAttendeeAttributes>({ event_id, user })
  return getEventAttendeeList(event_id)
}