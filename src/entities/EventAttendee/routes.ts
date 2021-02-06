import routes from "decentraland-gatsby/dist/entities/Route/routes";
import EventAttendee from '../EventAttendee/model';
import { auth, WithAuth } from 'decentraland-gatsby/dist/entities/Auth/middleware';
import { BASE_PATH } from '../Event/routes';
import { withEvent, WithEvent } from "../Event/middleware";
import { EventAttendeeAttributes } from './types';
import handle from 'decentraland-gatsby/dist/entities/Route/handle';
import EventModel from '../Event/model';
import { withAuthProfile, WithAuthProfile } from 'decentraland-gatsby/dist/entities/Profile/middleware'
import { getProfileSettings } from '../ProfileSettings/routes';

export default routes((router) => {
  const withAuth = auth({ optional: true })
  const withEventExists = withEvent()
  const withUserProfile = withAuthProfile({ optional: true })

  router.get(BASE_PATH + '/attendees', withEventExists, handle(getEventAttendees))
  router.post(BASE_PATH + '/attendees', withAuth, withUserProfile, withEventExists, handle(createEventAttendee))
  router.patch(BASE_PATH + '/attendees', withAuth, withEventExists, handle(updateEventAttendee))
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

  return EventModel.update({ total_attendees, latest_attendees }, { id: req.event.id })
}

export async function createEventAttendee(req: WithAuthProfile<WithEvent<WithAuth>>) {
  const user = req.auth!
  const user_name = req.authProfile?.name || null
  const settings = await getProfileSettings(user)
  await EventAttendee.create<EventAttendeeAttributes>({
    event_id: req.event.id,
    user,
    user_name,
    notify: settings.notify_by_email,
    notified: false,
    created_at: new Date(),
  })

  await updateEventAttendees(req)
  return getEventAttendeeList(req.event.id)
}

export async function updateEventAttendee(req: WithEvent<WithAuth>) {
  const user = req.auth!
  const identify = { event_id: req.event.id, user }
  const notify = Boolean(req.body && req.body.notify)
  await EventAttendee.update({ notify }, identify)
  return getEventAttendeeList(req.event.id)
}

export async function deleteEventAttendee(req: WithEvent<WithAuth>) {
  const user = req.auth!
  await EventAttendee.delete<EventAttendeeAttributes>({ event_id: req.event.id, user })
  await updateEventAttendees(req)
  return getEventAttendeeList(req.event.id)
}