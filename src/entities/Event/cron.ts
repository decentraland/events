import JobContext from "decentraland-gatsby/dist/entities/Job/context"

import Notifications, { EventsNotifications } from "../../api/Notifications"
import EventAttendeeModel from "../EventAttendee/model"
import EventNotificationsModel from "../EventNotifications/model"
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
  const events = await EventModel.getUpcomingEvents()
  ctx.log(`[${new Date().toJSON()}] ${events.length} upcoming events to notify`)

  if (events.length === 0) {
    return
  }

  for (const event of events) {
    const attendees = await EventAttendeeModel.listByEventId(event.id, {
      limit: null,
    })
    ctx.log(`${attendees.length} attendees to notify for Event: ${event.id}`)

    if (attendees.length === 0) {
      continue
    }

    for (const attendee of attendees) {
      await Notifications.get().sendEventStartsSoon({
        address: attendee.user,
        id: event.id,
        x: event.x,
        y: event.y,
        server: event.server,
        name: event.name,
        image: event.image || "",
        startsAt: event.start_at.toISOString(),
        endsAt: event.finish_at.toISOString(),
      })
    }

    await EventNotificationsModel.notificationSent(
      event.id,
      EventsNotifications.EVENT_STARTS_SOON
    )

    await notifyBySlack(event, attendees.length)
  }
}

export async function notifyStartedEvents(ctx: JobContext<{}>) {
  const events = await EventModel.getStartedEvents()
  ctx.log(
    `[${new Date().toJSON()}] ${events.length} just started events to notify`
  )

  if (events.length === 0) {
    return
  }

  for (const event of events) {
    const attendees = await EventAttendeeModel.listByEventId(event.id, {
      limit: null,
    })
    ctx.log(`${attendees.length} attendees to notify for Event: ${event.id}`)

    if (attendees.length === 0) {
      continue
    }

    for (const attendee of attendees) {
      await Notifications.get().sendEventStarted({
        address: attendee.user,
        id: event.id,
        x: event.x,
        y: event.y,
        server: event.server,
        name: event.name,
        image: event.image || "",
      })
    }

    await EventNotificationsModel.notificationSent(
      event.id,
      EventsNotifications.EVENT_STARTED
    )
  }
}
