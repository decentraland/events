import { resolve } from "path"

import { databaseInitializer } from "decentraland-gatsby/dist/entities/Database/utils"
import Manager from "decentraland-gatsby/dist/entities/Job/manager"
import { jobInitializer } from "decentraland-gatsby/dist/entities/Job/utils"
import profile from "decentraland-gatsby/dist/entities/Profile/routes"
import { gatsbyRegister } from "decentraland-gatsby/dist/entities/Prometheus/metrics"
import metrics from "decentraland-gatsby/dist/entities/Prometheus/routes/utils"
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
import env from "decentraland-gatsby/dist/utils/env"
import express from "express"
import { register } from "prom-client"

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
  withCors(),
  withDDosProtection(),
  withBody(),
  status(),
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

app.use(metrics([gatsbyRegister, register]))

app.use(env("NEW_ROLLOUT") !== undefined ? "/events" : "/", sitemap)
app.use(env("NEW_ROLLOUT") !== undefined ? "/events" : "/", social)

app.use(env("NEW_ROLLOUT") !== undefined ? "/events" : "/", [
  withCors({
    cors: "*",
    corsOrigin: "*",
    allowedHeaders: "*",
  }),
  gatsby(
    resolve(
      __filename,
      env("NEW_ROLLOUT") !== undefined ? "../../public-prefix" : "../../public"
    ),
    {
      contentSecurityPolicy: {
        fontSrc: [
          "https://decentraland.org",
          "https://decentraland.today",
          "https://decentraland.zone",
          "https://*.decentraland.org",
          "https://*.decentraland.today",
          "https://*.decentraland.zone",
          // Used to test the proxied service
          // "http://192.168.1.5:*",
        ],
        styleSrc: [
          "https://decentraland.org",
          "https://decentraland.today",
          "https://decentraland.zone",
          "https://*.decentraland.org",
          "https://*.decentraland.today",
          "https://*.decentraland.zone",
          // Used to test the proxied service
          // "http://192.168.1.5:*",
        ],
        imgSrc: [
          "https://decentraland.org",
          "https://decentraland.today",
          "https://decentraland.zone",
          "https://*.decentraland.org",
          "https://*.decentraland.today",
          "https://*.decentraland.zone",
          // Used to test the proxied service
          // "http://192.168.1.5:*",
        ],
        manifestSrc: [
          "https://decentraland.org",
          "https://decentraland.today",
          "https://decentraland.zone",
          "https://*.decentraland.org",
          "https://*.decentraland.today",
          "https://*.decentraland.zone",
          // Used to test the proxied service
          // "http://192.168.1.5:*",
        ],
        scriptSrc: [
          "https://decentraland.org",
          "https://decentraland.today",
          "https://decentraland.zone",
          "https://*.decentraland.org",
          "https://*.decentraland.today",
          "https://*.decentraland.zone",
          "https://connect.facebook.net",
          "http://*.hotjar.com:*",
          "https://*.hotjar.com:*",
          "http://*.hotjar.io",
          "https://*.hotjar.io",
          "wss://*.hotjar.com",
          "https://*.twitter.com",
          "https://cdn.segment.com",
          "https://ajax.cloudflare.com",
          "https://googleads.g.doubleclick.net",
          "https://ssl.google-analytics.com",
          "https://tagmanager.google.com",
          "https://www.google-analytics.com",
          "https://www.google-analytics.com",
          "https://www.google.com",
          "https://www.googleadservices.com",
          "https://www.googletagmanager.com",
          "https://app.intercom.io",
          "https://widget.intercom.io",
          "https://js.intercomcdn.com",
          "https://verify.walletconnect.com",
          "https://js.sentry-cdn.com",
          "https://browser.sentry-cdn.com",
          // Used to test the proxied service
          // "http://192.168.1.5:*",
        ].join(" "),
        connectSrc: [
          "https:",
          "*.sentry.io",
          "https://decentraland.org",
          "https://decentraland.today",
          "https://decentraland.zone",
          "https://*.decentraland.org",
          "https://*.decentraland.today",
          "https://*.decentraland.zone",
          // Used to test the proxied service
          // "http://192.168.1.5:*",
        ].join(" "),
        workerSrc: ["'self'", "blob:"].join(" "),
      },
    }
  ),
])

// Logger.subscribe("error", createSegmentSubscriber())

initializeServices([
  databaseInitializer(),
  jobInitializer(jobs),
  serverInitializer(app, process.env.PORT || 4000, process.env.HOST),
])
