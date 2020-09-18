import { utils } from 'decentraland-commons';
import env from 'decentraland-gatsby/dist/utils/env'
import Land from 'decentraland-gatsby/dist/utils/api/Land'
import { v4 as uuid } from 'uuid';
import EventModel from './model';
import { eventTargetUrl, calculateRecurrentProperties } from './utils'
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import EventAttendee from '../EventAttendee/model';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { auth, WithAuth } from 'decentraland-gatsby/dist/entities/Auth/middleware';
import { EventAttributes, adminPatchAttributes, patchAttributes, EventListOptions, DeprecatedEventAttributes, RecurrentEventAttributes, MAX_EVENT_RECURRENT, SessionEventAttributes } from './types';
import { withEvent, WithEvent } from './middleware';
import isAdmin from '../Auth/isAdmin';
import handle from 'decentraland-gatsby/dist/entities/Route/handle';
import { bool, integer } from 'decentraland-gatsby/dist/entities/Route/param';
import { withAuthProfile, WithAuthProfile } from '../Profile/middleware';
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst';
import { notifyNewEvent, notifyApprovedEvent, notifyEditedEvent, notifyEventError } from '../Slack/utils';
import { Request } from 'express';
import Context from 'decentraland-gatsby/dist/entities/Route/context';
import isEthereumAddress from 'validator/lib/isEthereumAddress';
import EventAttendeeModel from '../EventAttendee/model';
import { EventAttendeeAttributes } from '../EventAttendee/types';

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

export async function listEvents(req: WithAuth, _: Request, ctx: Context) {
  const options: Partial<EventListOptions> = {
    currentUser: req.auth,
    offset: integer(req.query['offset']) ?? 0,
    limit: integer(req.query['limit']) ?? 500,
  }

  if (req.query['position']) {
    const [x, y] = String(req.query['position']).split(',').slice(0, 2).map(integer)
    if (
      x !== null && y !== null &&
      x >= -150 && x <= 150 &&
      y >= -150 && y <= 150
    ) {
      options.x = x
      options.y = y
    } else {

      // out of bound
      return []
    }
  }

  if (req.query['estate_id']) {
    const estateId = integer(req.query['estate_id'])
    if (estateId !== null && Number.isFinite(estateId)) {
      options.estateId = String(estateId)
    } else {

      // out of bound
      return []
    }
  }

  if (req.query['user']) {
    if (isEthereumAddress(req.query['user'])) {
      options.user = String(req.query['user']).toLowerCase()
    } else {

      // invalid user address
      return []
    }
  }

  if (req.query['start_in']) {
    const startIn = integer(req.query['start_in'])
    if (startIn !== null && Number.isFinite(startIn) && startIn > 0) {
      options.startIn = startIn * 100
    } else {

      // out of bound
      return []
    }
  }

  if (
    ctx.param('onlyAttendee', { defaultValue: false, parser: bool }) ||  // @deprecated
    ctx.param('only_attendee', { defaultValue: false, parser: bool })
    ) {
    if (req.auth) {
      options.onlyAttendee = true
    } else {

      // attendee without user
      return []
    }
  }

  if (
    ctx.param('onlyUpcoming', { defaultValue: false, parser: bool }) || // @deprecated
    ctx.param('only_upcoming', { defaultValue: false, parser: bool })
  ) {
    options.onlyUpcoming = true
  }

  const events = await EventModel.getEvents(options)
  return events.map((event) => EventModel.toPublic(event, req.auth))
}

export async function getEvent(req: WithAuth<WithEvent>) {
  let attending = false
  if (req.auth) {
    attending = (await EventAttendee.count({ user: req.auth, event_id: req.event.id })) > 0
  }

  return { ...EventModel.toPublic(req.event, req.auth), attending }
}

export async function getAttendingEvents(req: WithAuth) {
  const events = await EventModel.getAttending(req.auth!)
  return events.map((event) => EventModel.toPublic(event, req.auth))
}

export async function createNewEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const userProfile = req.authProfile!
  const data = req.body as EventAttributes

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    const { authorization, ...headers } = req.headers
    throw new RequestError('Empty event data', RequestError.BadRequest, { body: data, headers, user })
  }

  if (!data.image) {
    data.image = null
  }

  if (!data.realm) {
    data.realm = null
  }

  if (!data.url) {
    data.url = eventTargetUrl(data)
  }

  const errors = EventModel.validate(data)
  if (errors) {
    const error = new RequestError('Invalid event data', RequestError.BadRequest, { errors, body: data })
    await notifyEventError(userProfile, error)
    throw error
  }

  const recurrent = calculateRecurrentProperties(data)
  const now = new Date()
  const event_id = uuid()
  const x = data.x
  const y = data.y
  const content = await Land.get().getMapContent([x, y], [x, y])
  const estate = content.assets.estates[0]
  const image = data.image || (estate ? Land.get().getEstateImage(estate.id) : Land.get().getParcelImage([x, y]))
  const user_name = userProfile.name || null;
  const estate_id = estate?.id || null;
  const estate_name = estate?.data?.name || null;
  const next_start_at = EventModel.selectNextStartAt(recurrent.duration, recurrent.start_at, recurrent.recurrent_dates)

  const event: DeprecatedEventAttributes = {
    ...data,
    ...recurrent,
    id: event_id,
    image,
    user: user.toLowerCase(),
    next_start_at,
    user_name,
    estate_id,
    estate_name,
    coordinates: [x, y],
    scene_name: estate_name,
    approved: false,
    rejected: false,
    highlighted: false,
    trending: false,
    total_attendees: 0,
    latest_attendees: [],
    created_at: now
  }

  await EventModel.create(event)
  await notifyNewEvent(event)

  return EventModel.toPublic(event, user)
}

export async function updateEvent(req: WithAuthProfile<WithAuth<WithEvent>>) {
  const user = req.auth!
  const event = req.event
  const attributes = isAdmin(user) ? adminPatchAttributes : patchAttributes
  let updatedAttributes = {
    ...utils.pick(event, attributes),
    ...utils.pick(req.body, attributes),
  } as DeprecatedEventAttributes

  if (!updatedAttributes.url || updatedAttributes.url.startsWith(DECENTRALAND_URL)) {
    updatedAttributes.url = eventTargetUrl(updatedAttributes)
  }

  const errors = EventModel.validate(updatedAttributes)
  if (errors) {
    throw new RequestError('Invalid event data', RequestError.BadRequest, { errors, update: updatedAttributes, body: req.body })
  }

  const userProfile = await Katalyst.get().getProfile(event.user)
  if (userProfile && userProfile.name && event.user_name !== userProfile.name) {
    updatedAttributes.user_name = userProfile.name
  }

  const x = updatedAttributes.x
  const y = updatedAttributes.y
  const content = await Land.get().getMapContent([x, y], [x, y])
  const estate = content.assets.estates[0]
  updatedAttributes.estate_id = estate?.id || updatedAttributes.estate_id
  updatedAttributes.estate_name = estate?.data?.name || updatedAttributes.estate_name
  updatedAttributes.scene_name = updatedAttributes.estate_name
  updatedAttributes.coordinates = [x, y]

  Object.assign(updatedAttributes, calculateRecurrentProperties(updatedAttributes))
  updatedAttributes.next_start_at = EventModel.selectNextStartAt(updatedAttributes.duration, updatedAttributes.start_at, updatedAttributes.recurrent_dates)

  if (updatedAttributes.rejected) {
    updatedAttributes.rejected = true
    updatedAttributes.approved = false
    updatedAttributes.highlighted = false
    updatedAttributes.trending = false
  }

  await EventModel.update(updatedAttributes, { id: event.id })

  const attendee = await EventAttendeeModel.findOne<EventAttendeeAttributes>({ user })
  const updatedEvent = {
    ...event,
    ...updatedAttributes,
    attending: !!attendee,
    notify: !!attendee?.notify
  }

  if (!req.event.approved && updatedEvent.approved) {
    notifyApprovedEvent(updatedEvent)
  } else if (!isAdmin(user)) {
    notifyEditedEvent(updatedEvent)
  }
  
  return EventModel.toPublic(updatedEvent, user)
}
