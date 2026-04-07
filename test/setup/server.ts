import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import {
  withBody,
  withCors,
} from "decentraland-gatsby/dist/entities/Route/middleware"
import express from "express"

import events from "../../src/entities/Event/routes"
import attendees from "../../src/entities/EventAttendee/routes"
import categories from "../../src/entities/EventCategory/routes"
import profileSettings from "../../src/entities/ProfileSettings/routes"
import profileSubscription from "../../src/entities/ProfileSubscription/routes"
import schedules from "../../src/entities/Schedule/routes"

export function createTestApp(): express.Express {
  const app = express()
  app.set("x-powered-by", false)
  app.use("/api", [
    withCors({
      corsOrigin: [/^http:\/\/localhost:[0-9]{1,10}$/],
      allowedHeaders: "*",
    }),
    withBody(),
    categories,
    events,
    schedules,
    attendees,
    profileSettings,
    profileSubscription,
    handle(async () => {
      throw new RequestError("NotFound", RequestError.NotFound)
    }),
  ])
  return app
}
