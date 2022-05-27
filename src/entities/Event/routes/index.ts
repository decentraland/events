import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import {
  WithAuth,
  auth,
} from "decentraland-gatsby/dist/entities/Auth/middleware"
import {
  WithAuthProfile,
  withAuthProfile,
} from "decentraland-gatsby/dist/entities/Profile/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import env from "decentraland-gatsby/dist/utils/env"

import { EventAttendeeAttributes } from "../../EventAttendee/types"
import ProfileSettingsModel from "../../ProfileSettings/model"
import ProfileSubscriptionModel from "../../ProfileSubscription/model"
import { notify } from "../cron"
import { WithEvent, withEvent } from "../middleware"
import { EventAttributes } from "../types"
import { createEvent } from "./createEvent"
import { getAttendingEventList } from "./getAttendingEventList"
import { getEvent } from "./getEvent"
import { getEventList } from "./getEventList"
import { updateEvent } from "./updateEvent"

export const DECENTRALAND_URL = env("DECENTRALAND_URL", "")

export default routes((router) => {
  const withAuth = auth()
  const withOptionalAuth = auth({ optional: true })
  const withPublicAccess = withCors({ cors: "*" })
  router.get(
    "/events",
    withPublicAccess,
    withOptionalAuth,
    handle(getEventList as any)
  )
  router.post("/events", withAuth, withAuthProfile(), handle(createEvent))
  router.get(
    "/events/attending",
    withPublicAccess,
    withAuth,
    handle(getAttendingEventList)
  )
  router.get(
    "/events/:event_id",
    withPublicAccess,
    withOptionalAuth,
    handle(getEvent)
  )
  router.patch("/events/:event_id", withAuth, handle(updateEvent))
  router.post(
    "/events/:event_id/notifications",
    withAuth,
    withAuthProfile(),
    handle(notifyEvent)
  )
})

async function notifyEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const profile = req.authProfile!
  const event = await getEvent(req)
  if (!isAdmin(user)) {
    return {}
  }

  const attendee: EventAttendeeAttributes = {
    event_id: event.id,
    user: profile.ethAddress,
    user_name: profile.name || "Guest",
    notify: true,
    notified: true,
    created_at: new Date(),
  }

  const profileSettings = await ProfileSettingsModel.findByUsers([user])
  const profileSubscriptions = await ProfileSubscriptionModel.findByUsers([
    user,
  ])
  const settings = Object.fromEntries(
    profileSettings.map((setting) => [setting.user, setting] as const)
  )
  const subscriptions = Object.fromEntries(
    profileSubscriptions.map(
      (subscription) => [subscription.user, subscription] as const
    )
  )
  const notifications = await notify(event, [attendee], settings, subscriptions)
  return notifications
}
