import { Request } from 'express';
import routes from "../Route/routes";
import EventAttendee from '../EventAttendee/model';
import { auth, WithAuth } from '../Auth/middleware';
import { BASE_PATH } from '../Event/routes';
import { getEventIdParam, withEvent, WithEvent } from "../Event/middleware";
import { EventAttendeeAttributes } from './types';
import handle from '../Route/handle';
import Event from '../Event/model';
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst';
import { withAuthProfile, WithAuthProfile } from '../Profile/middleware';

export default routes((router) => {

  const withAuth = auth({ optional: true })
  const withEventExists = withEvent()
  const withUserProfile = withAuthProfile({ optional: true })
  // const withAuthOptional = auth({ optional: true })

  router.get(BASE_PATH + '/attendees', withEventExists, handle(getEventAttendees))
  router.post(BASE_PATH + '/attendees', withAuth, withUserProfile, withEventExists, handle(createEventAttendee))
  router.delete(BASE_PATH + '/attendees', withAuth, withEventExists, handle(deleteEventAttendee))
})

export async function getEventAttendeeList(event_id: string) {
  return await EventAttendee.find<EventAttendeeAttributes>({ event_id })
}

export async function getEventAttendees(req: WithEvent) {
  return getEventAttendeeList(req.event.id)
}

export async function updateEventAttendees(req: WithEvent) {
  const [total_attendees, latest_attendees] = await Promise.all([
    EventAttendee.count({ event_id: req.event.id }),
    EventAttendee.latest(req.event.id)
  ])

  return Event.update({ total_attendees, latest_attendees }, { id: req.event.id })
}

export async function createEventAttendee(req: WithAuthProfile<WithEvent<WithAuth>>) {
  const user = req.auth!
  const user_name = req.authProfile?.name || null
  await EventAttendee.create<EventAttendeeAttributes>({ event_id: req.event.id, user, user_name, created_at: new Date() })
  await updateEventAttendees(req)
  return getEventAttendeeList(req.event.id)
}

export async function deleteEventAttendee(req: WithEvent<WithAuth>) {
  const user = req.auth!
  await EventAttendee.delete<EventAttendeeAttributes>({ event_id: req.event.id, user })
  await updateEventAttendees(req)
  return getEventAttendeeList(req.event.id)
}