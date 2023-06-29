import logger from "decentraland-gatsby/dist/entities/Development/logger"
import JobContext from "decentraland-gatsby/dist/entities/Job/context"
import { EventAttributes } from "events-type/src/types/Event"
import { EventAttendeeAttributes } from "events-type/src/types/EventAttendee"
import { ProfileSettingsAttributes } from "events-type/src/types/ProfileSettings"
import { ProfileSubscriptionAttributes } from "events-type/src/types/ProfileSubscription"

import EventModel from "./model"
import {
  calculateNextRecurrentDates,
  calculateRecurrentProperties,
  eventUrl,
} from "./utils"
import EventAttendeeModel from "../EventAttendee/model"
import push from "../Notification/push"
import { sendEmailUpcomingEvent } from "../Notification/utils"
import ProfileSettingsModel from "../ProfileSettings/model"
import ProfileSubscriptionModel from "../ProfileSubscription/model"
import { notifyUpcomingEvent as notifyBySlack } from "../Slack/utils"

export async function updateNextStartAt(ctx: JobContext<{}>) {
  const events = await EventModel.getRecurrentFinishedEvents()

  for (const event of events) {
    const update = {
      ...calculateRecurrentProperties(event),
      ...calculateNextRecurrentDates(event),
    }

    ctx.log(`updating next_start_at for event: "${event.id}"`)
    EventModel.update<EventAttributes>(update, { id: event.id })
  }
}

export async function notifyUpcomingEvents(ctx: JobContext<{}>) {
  const events = await EventModel.getUpcomingEvents()
  ctx.log(`[${new Date().toJSON()}] ${events.length} events to notify`)

  if (events.length === 0) {
    return
  }

  // const eventMap = new Map(events.map(event => [event.id, event] as const))
  const attendees = await EventAttendeeModel.getPendingNotification(
    events.map((event) => event.id)
  )
  ctx.log(`${attendees.length} attendees to notify`)

  if (attendees.length === 0) {
    return
  }

  const user = attendees.map((attendee) => attendee.user)
  const [settings, subscriptions] = await Promise.all([
    ProfileSettingsModel.findByUsers(user),
    ProfileSubscriptionModel.findByUsers(user),
  ])

  const settingMap = Object.fromEntries(
    settings.map((setting) => [setting.user, setting] as const)
  )
  const subscriptionMap = Object.fromEntries(
    subscriptions.map(
      (subscription) => [subscription.user, subscription] as const
    )
  )
  const expiredSubscriptions: ProfileSubscriptionAttributes[] = []

  for (const event of events) {
    const eventAttendees = attendees.filter(
      (attendee) => attendee.event_id === event.id
    )

    const result = await notify(
      event,
      eventAttendees,
      settingMap,
      subscriptionMap
    )
    ctx.log(
      `Notified event ${event.id} (email: ${result.email.length}, web: ${result.browser.length})`
    )

    if (result.email.length + result.browser.length) {
      await notifyBySlack(event, result.email.length, result.browser.length)
    }
  }

  await EventAttendeeModel.setNotified(attendees)
  await ProfileSubscriptionModel.deleteAll(expiredSubscriptions)
}

export async function notify(
  event: EventAttributes,
  attendees: EventAttendeeAttributes[],
  settings: Record<string, ProfileSettingsAttributes> = {},
  subscriptions: Record<string, ProfileSubscriptionAttributes> = {}
) {
  const email: ProfileSettingsAttributes[] = []
  const browser: ProfileSubscriptionAttributes[] = []
  const expired: ProfileSubscriptionAttributes[] = []

  for (const attendee of attendees) {
    const setting = settings[attendee.user]
    const subscription = subscriptions[attendee.user]

    if (setting && setting.email_verified && setting.notify_by_email) {
      email.push(setting)
    }

    if (setting && setting.notify_by_browser && subscription) {
      browser.push(subscription)
    }
  }

  const data = {
    title: event.name,
    href: eventUrl(event),
    tag: event.id,
    image: event.image!,
  }

  const proms: Promise<any>[] = browser.map(async (subscription) => {
    return push(subscription, data).catch((error) => {
      logger.error(
        `Error sending push notification to user "${subscription.user}"`,
        { subscription, data }
      )
      error.statusCode === 410 && expired.push(subscription)
    })
  })

  proms.push(sendEmailUpcomingEvent(event, email))
  const notifications = await Promise.all(proms)

  return {
    data,
    email,
    browser,
    expired,
    notifications,
  }
}
