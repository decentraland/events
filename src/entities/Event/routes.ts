import { utils } from 'decentraland-commons';
import env from 'decentraland-gatsby/dist/utils/env'
import Land from 'decentraland-gatsby/dist/utils/api/Land'
import { v4 as uuid } from 'uuid';
import Event from './model';
import routes from "../Route/routes";
import EventAttendee from '../EventAttendee/model';
import RequestError from '../Route/error';
import { auth, WithAuth } from '../Auth/middleware';
import { EventAttributes, adminPatchAttributes, patchAttributes } from './types';
import { withEvent, WithEvent } from './middleware';
import isAdmin from '../Auth/isAdmin';
import handle from '../Route/handle';
import { withAuthProfile, WithAuthProfile } from '../Profile/middleware';
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst';
import { notifyNewEvent, notifyApprovedEvent, notifyEditedEvent, notifyEventError } from '../Slack/utils';

const DECENTRALAND_URL = env('DECENTRALAND_URL', '')
export const BASE_PATH = '/events/:eventId'

export default routes((router) => {

  const withAuth = auth()
  const withOptionalAuth = auth({ optional: true })
  const withEventExists = withEvent()
  const withEventOwner = withEvent({ owner: true })

  router.get('/events', withOptionalAuth, handle(listEvents))
  router.post('/events', withAuth, withAuthProfile(), handle(createNewEvent))
  router.get('/events/attending', withAuth, handle(getAttendingEvents))
  router.get(BASE_PATH, withOptionalAuth, withEventExists, handle(getEvent))
  router.patch(BASE_PATH, withAuth, withEventOwner, handle(updateEvent))
})

export async function listEvents(req: WithAuth) {
  const events = await Event.getEvents(req.auth)
  return events.map((event) => Event.toPublic(event, req.auth))
}

export async function getEvent(req: WithAuth<WithEvent>) {
  let attending = false
  if (req.auth) {
    attending = (await EventAttendee.count({ user: req.auth })) > 0
  }

  return { ...Event.toPublic(req.event, req.auth), attending }
}

export async function getAttendingEvents(req: WithAuth) {
  const events = await Event.getAttending(req.auth!)
  return events.map((event) => Event.toPublic(event, req.auth))
}

export async function createNewEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const userProfile = req.authProfile!
  const data = req.body as EventAttributes

  if (!data.url) {
    data.url = `${DECENTRALAND_URL}/?position=${(data.coordinates || [0, 0]).join(',')}`
  }

  if (!data.image) {
    (data as any).image = null
  }

  const errors = Event.validate(data)
  if (errors) {
    const error = new RequestError('Invalid event data', RequestError.StatusCode.BadRequest, { errors, body: data })
    await notifyEventError(userProfile, error)
    throw error
  }

  const now = new Date()
  const event_id = uuid()
  const [x, y] = data.coordinates
  const content = await Land.get().getMapContent([x, y], [x, y])
  const state = content.assets.estates[0]
  const parcel = content.assets.parcels[0]

  const event: EventAttributes = {
    ...data,
    id: event_id,
    image: state ? Land.get().getEstateImage(state.id) : Land.get().getParcelImage([x, y]),
    user: user.toLowerCase(),
    user_name: userProfile.name || null,
    scene_name: state?.data?.name || parcel?.data?.name || null,
    approved: false,
    rejected: false,
    total_attendees: 0,
    latest_attendees: [],
    created_at: now
  }

  await Event.create(event)
  await notifyNewEvent(event)

  return Event.toPublic(event, user)
}

export async function updateEvent(req: WithAuthProfile<WithAuth<WithEvent>>) {
  const user = req.auth!
  const event = req.event
  const attributes = isAdmin(user) ? adminPatchAttributes : patchAttributes
  let updatedAttributes = {
    ...utils.pick(event, attributes),
    ...utils.pick(req.body, attributes),
  } as EventAttributes

  if (!updatedAttributes.url || updatedAttributes.url.startsWith(DECENTRALAND_URL)) {
    updatedAttributes.url = `${DECENTRALAND_URL}/?position=${(updatedAttributes.coordinates || [0, 0]).join(',')}`
  }

  const errors = Event.validate(updatedAttributes)
  if (errors) {
    throw new RequestError('Invalid event data', RequestError.StatusCode.BadRequest, { errors, update: updatedAttributes, body: req.body })
  }

  const userProfile = await Katalyst.get().getProfile(event.user)
  if (userProfile && userProfile.name && event.user_name !== userProfile.name) {
    updatedAttributes.user_name = userProfile.name
  }

  await Event.update(updatedAttributes, { id: event.id })

  const updatedEvent = { ...event, ...updatedAttributes }

  if (!req.event.approved && updatedEvent.approved) {
    notifyApprovedEvent(updatedEvent)
  } else if (!isAdmin(user)) {
    notifyEditedEvent(updatedEvent)
  }

  return Event.toPublic(updatedEvent, user)
}