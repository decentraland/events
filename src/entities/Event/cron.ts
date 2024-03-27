import JobContext from "decentraland-gatsby/dist/entities/Job/context"

import Notifications, { EventsNotifications } from "../../api/Notifications"
import EventAttendeeModel from "../EventAttendee/model"
import NotificationCursorsModel from "../NotificationCursors/model"
import { notifyUpcomingEvent as notifyBySlack } from "../Slack/utils"
import EventModel from "./model"
import { EventAttributes } from "./types"
import {
  calculateNextRecurrentDates,
  calculateRecurrentProperties,
} from "./utils"

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
  const lastRun =
    await NotificationCursorsModel.getLastUpdateForNotificationType(
      EventsNotifications.EVENT_STARTS_SOON
    )

  console.log("date > ", new Date(lastRun).toISOString())

  const events = await EventModel.getUpcomingEvents(lastRun)
  ctx.log(`[${new Date().toJSON()}] ${events.length} upcoming events to notify`)

  for (const event of events) {
    const attendees = await EventAttendeeModel.listByEventId(event.id, {
      limit: null,
    })
    ctx.log(`${attendees.length} attendees to notify for Event: ${event.id}`)

    if (attendees.length === 0) {
      continue
    }

    await Notifications.get().sendEventStartsSoon(event, attendees)
    await notifyBySlack(event, attendees.length)
  }

  await NotificationCursorsModel.updateLastUpdateForNotificationType(
    EventsNotifications.EVENT_STARTS_SOON,
    getNowPlusHour(lastRun)
  )
}

export async function notifyStartedEvents(ctx: JobContext<{}>) {
  const lastRun =
    await NotificationCursorsModel.getLastUpdateForNotificationType(
      EventsNotifications.EVENT_STARTED
    )

  console.log("date 2 > ", new Date(lastRun).toISOString())

  const events = await EventModel.getStartedEvents(lastRun)
  ctx.log(
    `[${new Date().toJSON()}] ${events.length} just started events to notify`
  )

  for (const event of events) {
    const attendees = await EventAttendeeModel.listByEventId(event.id, {
      limit: null,
    })
    ctx.log(`${attendees.length} attendees to notify for Event: ${event.id}`)

    if (attendees.length === 0) {
      continue
    }

    await Notifications.get().sendEventStarted(event, attendees)
  }

  await NotificationCursorsModel.updateLastUpdateForNotificationType(
    EventsNotifications.EVENT_STARTED,
    getNowPlusMins(lastRun)
  )
}

function getNowPlusHour(ts: number) {
  const hoursToAdd = 1 * 60 * 60 * 1000
  const now = new Date(ts)
  now.setTime(now.getTime() + hoursToAdd)
  return now.getTime()
}

function getNowPlusMins(ts: number) {
  const minsToAdd = 2 * 60000
  const now = new Date(ts)
  now.setTime(now.getTime() + minsToAdd)
  return now.getTime()
}
