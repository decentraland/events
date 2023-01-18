import { resolve } from "path"

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
import gatsby from "decentraland-gatsby/dist/entities/Route/routes/filesystem2/gatsby"
import status from "decentraland-gatsby/dist/entities/Route/routes/status"
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

app.use(sitemap)
app.use("/", social)

app.use(
  gatsby(resolve(__filename, "../../public"), {
    contentSecurityPolicy: {
      scriptSrc: [
        "https://decentraland.org",
        "https://*.decentraland.org",
        "https://connect.facebook.net",
        "http://*.hotjar.com:*",
        "https://*.hotjar.com:*",
        "http://*.hotjar.io",
        "https://*.hotjar.io",
        "wss://*.hotjar.com",
        "https://*.twitter.com",
        "https://cdn.segment.com",
        "https://cdn.rollbar.com",
        "https://ajax.cloudflare.com",
        "https://googleads.g.doubleclick.net",
        "https://ssl.google-analytics.com",
        "https://tagmanager.google.com",
        "https://www.google-analytics.com",
        "https://www.google-analytics.com",
        "https://www.google.com",
        "https://www.googleadservices.com",
        "https://www.googletagmanager.com",
      ].join(" "),
    },
  })
)

// Logger.subscribe("error", createSegmentSubscriber())

initializeServices([
  databaseInitializer(),
  jobInitializer(jobs),
  serverInitializer(app, process.env.PORT || 4000, process.env.HOST),
])
