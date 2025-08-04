import JobContext from "decentraland-gatsby/dist/entities/Job/context"

import EventModel from "./model"
import { EventAttributes } from "./types"
import {
  calculateNextRecurrentDates,
  calculateRecurrentProperties,
} from "./utils"
import Communities from "../../api/Communities"
import Notifications, { EventsNotifications } from "../../api/Notifications"
import EventAttendeeModel from "../EventAttendee/model"
import NotificationCursorsModel from "../NotificationCursors/model"
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
  const lastRun =
    await NotificationCursorsModel.getLastUpdateForNotificationType(
      EventsNotifications.EVENT_STARTS_SOON
    )
  const now = Date.now()

  const ahead = 60 * 60 * 1000 // 1 hour in the future
  const events = await EventModel.getEventsStartingInRange(
    lastRun + ahead,
    now + ahead
  )
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
    now
  )
}

export async function notifyStartedEvents(ctx: JobContext<{}>) {
  const lastRun =
    await NotificationCursorsModel.getLastUpdateForNotificationType(
      EventsNotifications.EVENT_STARTED
    )
  const now = Date.now()

  const events = await EventModel.getEventsStartingInRange(lastRun, now)
  ctx.log(
    `[${new Date().toJSON()}] ${events.length} just started events to notify`
  )

  for (const event of events) {
    let attendees = await EventAttendeeModel.listByEventId(event.id, {
      limit: null,
    })
    ctx.log(`${attendees.length} attendees to notify for Event: ${event.id}`)

    if (event.community_id) {
      const community = await Communities.get().getCommunity(event.community_id)

      if (community) {
        const communityMembers = await Communities.get().getCommunityMembers(
          event.community_id
        )

        const communityMembersAttendees = communityMembers.map((member) => ({
          event_id: event.id,
          user: member.memberAddress,
          user_name: member.name || "",
          created_at: new Date(),
        }))

        if (communityMembersAttendees.length > 0) {
          // prevent duplications of notifications
          attendees = attendees.filter(
            (attendee) =>
              !communityMembersAttendees.some(
                (member) =>
                  member.user.toLowerCase() === attendee.user.toLowerCase()
              )
          )

          await Notifications.get().sendEventStarted(
            event,
            communityMembersAttendees,
            {
              isLinkedToCommunity: true,
              communityName: community.name,
              communityThumbnail: community.thumbnails?.raw,
            }
          )
        }
      }
    }

    if (attendees.length === 0) {
      continue
    }
    await Notifications.get().sendEventStarted(event, attendees)
  }

  await NotificationCursorsModel.updateLastUpdateForNotificationType(
    EventsNotifications.EVENT_STARTED,
    now
  )
}
