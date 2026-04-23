import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { withAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import env from "decentraland-gatsby/dist/utils/env"

import {
  approveEvent,
  getEventAdmin,
  getEventAdminList,
  patchEventAdmin,
  rejectEvent,
  unapproveEvent,
  unrejectEvent,
} from "./admin"
import { createEvent } from "./createEvent"
import { getAttendingEventList } from "./getAttendingEventList"
import { getEvent } from "./getEvent"
import { getEventList } from "./getEventList"
import { adminBearer } from "./middleware/adminBearer"
import { updateEvent } from "./updateEvent"

export const JUMP_IN_SITE_URL = env(
  "JUMP_IN_SITE_URL",
  "https://decentraland.org/jump"
)

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
  router.post(
    "/events/search",
    withPublicAccess,
    withOptionalAuth,
    handle(getEventList as any)
  )
  router.get(
    "/events/attending",
    withPublicAccess,
    withAuth,
    handle(getAttendingEventList)
  )
  router.get("/events/admin", adminBearer, handle(getEventAdminList as any))
  router.get(
    "/events/:event_id/admin",
    adminBearer,
    handle(getEventAdmin as any)
  )
  router.get(
    "/events/:event_id",
    withPublicAccess,
    withOptionalAuth,
    handle(getEvent)
  )
  router.put(
    "/events/:event_id/approved",
    adminBearer,
    handle(approveEvent as any)
  )
  router.delete(
    "/events/:event_id/approved",
    adminBearer,
    handle(unapproveEvent as any)
  )
  router.put(
    "/events/:event_id/rejected",
    adminBearer,
    handle(rejectEvent as any)
  )
  router.delete(
    "/events/:event_id/rejected",
    adminBearer,
    handle(unrejectEvent as any)
  )
  router.patch(
    "/events/:event_id/admin",
    adminBearer,
    handle(patchEventAdmin as any)
  )
  router.patch("/events/:event_id", withAuth, handle(updateEvent))
})
