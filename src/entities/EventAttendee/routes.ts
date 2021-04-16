import routes from "decentraland-gatsby/dist/entities/Route/routes";
import { auth, WithAuth } from 'decentraland-gatsby/dist/entities/Auth/middleware';
import { BASE_PATH } from '../Event/routes';
import { requireEvent, withEvent, WithEvent } from "../Event/middleware";
import { EventAttendeeAttributes } from './types';
import handle from 'decentraland-gatsby/dist/entities/Route/handle';
import EventModel from '../Event/model';
import { withAuthProfile, WithAuthProfile } from 'decentraland-gatsby/dist/entities/Profile/middleware'
import { getProfileSettings } from '../ProfileSettings/routes';
import { AttendPayloadAttributes } from "../Message/types";
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst";
import API from "decentraland-gatsby/dist/utils/api/API";
import EventAttendeeModel from "../EventAttendee/model";

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
  return EventAttendeeModel.listByEventId(event_id)
}

export async function getEventAttendees(req: WithEvent) {
  return getEventAttendeeList(req.event.id)
}

export async function updateEventAttendees(req: WithEvent) {
  return updateEventAttendeesById(req.event.id)
}

async function updateEventAttendeesById(event_id: string) {
  const [total_attendees, latest_attendees] = await Promise.all([
    EventAttendeeModel.count({ event_id }),
    EventAttendeeModel.latest(event_id)
  ])

  return EventModel.update({ total_attendees, latest_attendees }, { id: event_id })
}

export async function createEventAttendee(req: WithAuthProfile<WithEvent<WithAuth>>) {
  const user = req.auth!
  const user_name = req.authProfile?.name || null
  const settings = await getProfileSettings(user)
  await EventAttendeeModel.create<EventAttendeeAttributes>({
    event_id: req.event.id,
    user,
    user_name,
    notify: settings.notify_by_email,
    notified: false,
    created_at: new Date(),
  })

  await updateEventAttendeesById(req.event.id)
  return getEventAttendeeList(req.event.id)
}

export async function updateEventAttendee(req: WithEvent<WithAuth>) {
  const user = req.auth!
  const identify = { event_id: req.event.id, user }
  const notify = Boolean(req.body && req.body.notify)
  await EventAttendeeModel.update({ notify }, identify)
  return getEventAttendeeList(req.event.id)
}

export async function deleteEventAttendee(req: WithEvent<WithAuth>) {
  const user = req.auth!
  await EventAttendeeModel.delete<EventAttendeeAttributes>({ event_id: req.event.id, user })
  await updateEventAttendeesById(req.event.id)
  return getEventAttendeeList(req.event.id)
}

export async function handleAttendMessage(payload: AttendPayloadAttributes & { address: string }) {
  const event = await requireEvent(payload.event, { rejected: false, approved: true })
  const users = await API.catch(Catalyst.get().getProfiles([ payload.address ]))
  const user = users && users[0]

  const alreadyExists = await EventAttendeeModel.count<EventAttendeeAttributes>({ user: payload.address, event_id: event.id })
  if (payload.attend === false && alreadyExists > 0) {
    await EventAttendeeModel.delete<EventAttendeeAttributes>({ user: payload.address, event_id: event.id })
  } else if (payload.attend !== false && alreadyExists === 0) {
    const settings = await getProfileSettings(payload.address)
    await EventAttendeeModel.create<EventAttendeeAttributes>({
      event_id: event.id,
      user: payload.address,
      user_name: user?.name || null,
      notify: settings.notify_by_email,
      notified: false,
      created_at: new Date(),
    })
  }

  await updateEventAttendeesById(event.id)
  return payload.attend === false ? false : true
}