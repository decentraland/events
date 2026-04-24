import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { withAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { Request } from "express"

import { getEventAdmin, getEventAdminList, patchEventAdmin } from "./admin"
import { createEvent } from "./createEvent"
import { getAttendingEventList } from "./getAttendingEventList"
import { getEvent } from "./getEvent"
import { getEventList } from "./getEventList"
import { WithAdminBearer, adminBearer } from "./middleware/adminBearer"
import { updateEvent } from "./updateEvent"

type MaybeAdminRequest = Request & WithAdminBearer & { auth?: string }

function requireAuthOrAdmin(req: MaybeAdminRequest): void {
  if (!req.auth && !req.isAdminBearer) {
    throw new RequestError("Unauthorized", RequestError.Unauthorized)
  }
}

async function getEventRoute(req: MaybeAdminRequest) {
  if (req.isAdminBearer) {
    return getEventAdmin(req as Parameters<typeof getEventAdmin>[0])
  }
  return getEvent(req as Parameters<typeof getEvent>[0])
}

async function getEventListRoute(req: MaybeAdminRequest) {
  if (req.isAdminBearer) {
    return getEventAdminList(req as Parameters<typeof getEventAdminList>[0])
  }
  return getEventList(req as Parameters<typeof getEventList>[0])
}

async function patchEventRoute(req: MaybeAdminRequest) {
  requireAuthOrAdmin(req)
  if (req.isAdminBearer) {
    return patchEventAdmin(req as Parameters<typeof patchEventAdmin>[0])
  }
  return updateEvent(req as Parameters<typeof updateEvent>[0])
}

export default routes((router) => {
  const withAuth = auth()
  const withOptionalAuth = auth({ optional: true })
  const withPublicAccess = withCors({ cors: "*" })
  router.get(
    "/events",
    withPublicAccess,
    withOptionalAuth,
    adminBearer,
    handle(getEventListRoute as any)
  )
  router.post("/events", withAuth, withAuthProfile(), handle(createEvent))
  router.post(
    "/events/search",
    withPublicAccess,
    withOptionalAuth,
    adminBearer,
    handle(getEventListRoute as any)
  )
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
    adminBearer,
    handle(getEventRoute as any)
  )
  router.patch(
    "/events/:event_id",
    withOptionalAuth,
    adminBearer,
    handle(patchEventRoute as any)
  )
})
