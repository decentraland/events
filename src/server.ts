import metricsDatabase from "decentraland-gatsby/dist/entities/Database/routes"
import { databaseInitializer } from "decentraland-gatsby/dist/entities/Database/utils"
import createSegmentSubscriber from "decentraland-gatsby/dist/entities/Development/createSegmentSubscriber"
import { Logger } from "decentraland-gatsby/dist/entities/Development/logger"
import Manager from "decentraland-gatsby/dist/entities/Job/manager"
import { jobInitializer } from "decentraland-gatsby/dist/entities/Job/utils"
import profile from "decentraland-gatsby/dist/entities/Profile/routes"
import metrics from "decentraland-gatsby/dist/entities/Prometheus/routes"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import {
  withBody,
  withCors,
  withDDosProtection,
  withLogs,
} from "decentraland-gatsby/dist/entities/Route/middleware"
import {
  filesystem,
  status,
} from "decentraland-gatsby/dist/entities/Route/routes"
import { initializeServices } from "decentraland-gatsby/dist/entities/Server/handler"
import { serverInitializer } from "decentraland-gatsby/dist/entities/Server/utils"
import express from "express"

import { notifyUpcomingEvents, updateNextStartAt } from "./entities/Event/cron"
import events from "./entities/Event/routes"
import attendees from "./entities/EventAttendee/routes"
import categories from "./entities/EventCategory/routes"
import poster from "./entities/Poster/routes"
import profileSettings from "./entities/ProfileSettings/routes"
import {
  removeSubscription,
  verifySubscription,
} from "./entities/ProfileSettings/routes/subscriptions"
import {
  SUBSCRIPTION_PATH,
  UNSUBSCRIBE_PATH,
} from "./entities/ProfileSettings/types"
import profileSubscription from "./entities/ProfileSubscription/routes"
import schedules from "./entities/Schedule/routes"
import sitemap from "./entities/Sitemap/routes"
import social from "./entities/Social/routes"

const jobs = new Manager({ concurrency: 10 })
jobs.cron("@eachMinute", notifyUpcomingEvents)
jobs.cron("@eachMinute", updateNextStartAt)

const app = express()
app.set("x-powered-by", false)
app.use(withLogs())
app.use("/api", [
  status(),
  withCors(),
  withDDosProtection(),
  withBody(),
  categories,
  events,
  poster,
  schedules,
  attendees,
  profileSettings,
  profileSubscription,
  profile,
  handle(async () => {
    throw new RequestError("NotFound", RequestError.NotFound)
  }),
])

app.get(SUBSCRIPTION_PATH, verifySubscription)
app.get(UNSUBSCRIBE_PATH, removeSubscription)

app.use(metrics)
app.use(metricsDatabase)
app.get(
  "/metrics/*",
  handle(async () => {
    throw new RequestError("NotFound", RequestError.NotFound)
  })
)

app.use(sitemap)
app.use("/", social)
app.use(filesystem("public", "404.html"))

Logger.subscribe("error", createSegmentSubscriber())

initializeServices([
  databaseInitializer(),
  jobInitializer(jobs),
  serverInitializer(app, process.env.PORT || 4000, process.env.HOST),
])
