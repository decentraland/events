import {
  WithAuth,
  auth,
} from "decentraland-gatsby/dist/entities/Auth/middleware"
import {
  WithAuthProfile,
  withAuthProfile,
} from "decentraland-gatsby/dist/entities/Profile/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { EventAttendeeAttributes } from "events-type/src/types/EventAttendee"

import EventModel from "../Event/model"
import { getEvent } from "../Event/routes/getEvent"
import EventAttendeeModel from "../EventAttendee/model"
import ProfileSettingsModel from "../ProfileSettings/model"

export default routes((router) => {
  const withAuth = auth({ optional: true })
  const withUserProfile = withAuthProfile({ optional: true })

  router.get("/events/:event_id/attendees", handle(getEventAttendees))
  router.post(
    "/events/:event_id/attendees",
    withAuth,
    withUserProfile,
    handle(createEventAttendee)
  )
  router.patch(
    "/events/:event_id/attendees",
    withAuth,
    handle(updateEventAttendee)
  )
  router.delete(
    "/events/:event_id/attendees",
    withAuth,
    handle(deleteEventAttendee)
  )
})

export async function getEventAttendeeList(event_id: string) {
  return EventAttendeeModel.listByEventId(event_id)
}

export async function getEventAttendees(req: WithAuth) {
  const event = await getEvent(req)
  return getEventAttendeeList(event.id)
}

export async function updateEventAttendees(req: WithAuth) {
  const event = await getEvent(req)
  return updateEventAttendeesById(event.id)
}

async function updateEventAttendeesById(event_id: string) {
  const [total_attendees, latest_attendees] = await Promise.all([
    EventAttendeeModel.count({ event_id }),
    EventAttendeeModel.latest(event_id),
  ])

  return EventModel.update(
    { total_attendees, latest_attendees },
    { id: event_id }
  )
}

export async function createEventAttendee(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const user_name = req.authProfile?.name || null
  const event = await getEvent(req)
  const settings = await ProfileSettingsModel.findOrGetDefault(user)
  await EventAttendeeModel.create<EventAttendeeAttributes>({
    event_id: event.id,
    user,
    user_name,
    notify: settings.notify_by_email,
    notified: false,
    created_at: new Date(),
  })

  await updateEventAttendeesById(event.id)
  return getEventAttendeeList(event.id)
}

export async function updateEventAttendee(req: WithAuth) {
  const user = req.auth!
  const event = await getEvent(req)
  const identify = { event_id: event.id, user }
  const notify = Boolean(req.body && req.body.notify)
  await EventAttendeeModel.update({ notify }, identify)
  return getEventAttendeeList(event.id)
}

export async function deleteEventAttendee(req: WithAuth) {
  const user = req.auth!
  const event = await getEvent(req)
  await EventAttendeeModel.delete<EventAttendeeAttributes>({
    event_id: event.id,
    user,
  })
  await updateEventAttendeesById(event.id)
  return getEventAttendeeList(event.id)
}
