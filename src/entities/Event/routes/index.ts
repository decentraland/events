import env from 'decentraland-gatsby/dist/utils/env'
import { createValidator } from 'decentraland-gatsby/dist/entities/Route/validate'
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware";
import { auth, WithAuth } from 'decentraland-gatsby/dist/entities/Auth/middleware';
import { EventAttributes } from '../types';
import { withEvent, WithEvent } from '../middleware';
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin";
import handle from 'decentraland-gatsby/dist/entities/Route/handle';
import { withAuthProfile, WithAuthProfile } from 'decentraland-gatsby/dist/entities/Profile/middleware';
import { EventAttendeeAttributes } from '../../EventAttendee/types';
import ProfileSettingsModel from '../../ProfileSettings/model'
import ProfileSubscriptionModel from '../../ProfileSubscription/model'
import { notify } from '../cron';
import { getEventList } from './getEventList';
import { getEvent } from './getEvent';
import { getAttendingEventList } from './getAttendingEventList';
import { createEvent } from './createEvent';
import { updateEvent } from './updateEvent';

export const DECENTRALAND_URL = env('DECENTRALAND_URL', '')
export const BASE_PATH = '/events/:event_id'

export default routes((router) => {
  const withAuth = auth()
  const withOptionalAuth = auth({ optional: true })
  const withEventExists = withEvent()
  const withPublicAccess = withCors({ cors: '*' })
  router.get('/events', withPublicAccess, withOptionalAuth, handle(getEventList as any))
  router.post('/events', withAuth, withAuthProfile(), handle(createEvent))
  router.get('/events/attending', withPublicAccess, withAuth, handle(getAttendingEventList))
  router.get('/events/:event_id', withPublicAccess, withOptionalAuth, withEventExists, handle(getEvent))
  router.patch('/events/:event_id', withAuth, handle(updateEvent))
  router.post('/events/:event_id/notifications', withAuth, withAuthProfile(), withEventExists, handle(notifyEvent))
})

async function notifyEvent(req: WithEvent<WithAuthProfile<WithAuth>>) {
  const user = req.auth!
  const profile = req.authProfile!
  const event = req.event!
  if (!isAdmin(user)) {
    return {}
  }

  const attendee: EventAttendeeAttributes = {
    event_id: event.id,
    user: profile.ethAddress,
    user_name: profile.name || 'Guest',
    notify: true,
    notified: true,
    created_at: new Date
  }

  const profileSettings = await ProfileSettingsModel.findByUsers([ user ])
  const profileSubscriptions = await ProfileSubscriptionModel.findByUsers([ user ])
  const settings = Object.fromEntries(profileSettings.map(setting => [ setting.user, setting ] as const))
  const subscriptions = Object.fromEntries(profileSubscriptions.map(subscription => [ subscription.user, subscription ] as const))
  const notifications = await notify(event, [ attendee ], settings, subscriptions)
  return notifications
}