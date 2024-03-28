import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { withAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import env from "decentraland-gatsby/dist/utils/env"

import { createEvent } from "./createEvent"
import { getAttendingEventList } from "./getAttendingEventList"
import { getEvent } from "./getEvent"
import { getEventList } from "./getEventList"
import { updateEvent } from "./updateEvent"

export const DECENTRALAND_URL = env(
  "DECENTRALAND_URL",
  "https://play.decentraland.org"
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
})
