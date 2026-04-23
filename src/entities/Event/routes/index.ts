import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { withAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import env from "decentraland-gatsby/dist/utils/env"
import { Request } from "express"

import { getEventAdmin, getEventAdminList, patchEventAdmin } from "./admin"
import { createEvent } from "./createEvent"
import { getAttendingEventList } from "./getAttendingEventList"
import { getEvent } from "./getEvent"
import { getEventList } from "./getEventList"
import {
  adminBearerOrAuth,
  adminBearerOrOptionalAuth,
} from "./middleware/adminBearer"
import { updateEvent } from "./updateEvent"

export const JUMP_IN_SITE_URL = env(
  "JUMP_IN_SITE_URL",
  "https://decentraland.org/jump"
)

type AdminFlaggedRequest = Request & { isAdminBearer?: boolean }

function isAdminBearer(req: Request): boolean {
  return (req as AdminFlaggedRequest).isAdminBearer === true
}

async function dispatchGetEvent(req: Request) {
  if (isAdminBearer(req)) {
    return getEventAdmin(req as Parameters<typeof getEventAdmin>[0])
  }
  return getEvent(req as Parameters<typeof getEvent>[0])
}

async function dispatchGetEventList(req: Request) {
  if (isAdminBearer(req)) {
    return getEventAdminList(req as Parameters<typeof getEventAdminList>[0])
  }
  return getEventList(req as Parameters<typeof getEventList>[0])
}

async function dispatchPatchEvent(req: Request) {
  if (isAdminBearer(req)) {
    return patchEventAdmin(req as Parameters<typeof patchEventAdmin>[0])
  }
  return updateEvent(req as Parameters<typeof updateEvent>[0])
}

export default routes((router) => {
  const withAuth = auth()
  const withPublicAccess = withCors({ cors: "*" })
  router.get(
    "/events",
    withPublicAccess,
    adminBearerOrOptionalAuth(),
    handle(dispatchGetEventList as any)
  )
  router.post("/events", withAuth, withAuthProfile(), handle(createEvent))
  router.post(
    "/events/search",
    withPublicAccess,
    adminBearerOrOptionalAuth(),
    handle(dispatchGetEventList as any)
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
    adminBearerOrOptionalAuth(),
    handle(dispatchGetEvent as any)
  )
  router.patch(
    "/events/:event_id",
    adminBearerOrAuth(),
    handle(dispatchPatchEvent as any)
  )
})
