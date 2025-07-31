import API from "decentraland-gatsby/dist/utils/api/API"
import env from "decentraland-gatsby/dist/utils/env"

import { EventAttributes } from "../entities/Event/types"
import { EventAttendeeAttributes } from "../entities/EventAttendee/types"

type DCLNotification<T, M> = {
  eventKey: string
  type: T
  address?: string
  metadata: M & { title: string; description: string }
  timestamp: number
}

export enum EventsNotifications {
  EVENT_STARTS_SOON = "events_starts_soon",
  COMMUNITY_EVENT_STARTS_SOON = "community_events_starts_soon",
  EVENT_STARTED = "events_started",
}

export type EventStartsSoonNotification = DCLNotification<
  EventsNotifications.EVENT_STARTS_SOON,
  {
    name: string
    image: string
    link: string
    startsAt: string
    endsAt: string
  }
>

export type EventStartedNotification = DCLNotification<
  EventsNotifications.EVENT_STARTED,
  {
    name: string
    image: string
    link: string
  }
>

export default class Notifications extends API {
  static Url = env(
    "NOTIFICATION_SERVICE_URL",
    `https://notifications-processor.decentraland.zone`
  )
  static Token = env("NOTIFICATION_SERVICE_TOKEN", "")
  static ExplorerURL = env("EXPLORER_URL", "https://play.decentraland.org/")

  static Cache = new Map<string, Notifications>()

  static from(url: string) {
    if (!this.Cache.has(url)) {
      this.Cache.set(url, new Notifications(url))
    }

    return this.Cache.get(url)!
  }

  static get() {
    return this.from(this.Url)
  }

  private async sendNotification<T>(notifications: T[]) {
    return this.fetch(
      "/notifications",
      this.options()
        .method("POST")
        .headers({
          Authorization: `Bearer ${env("NOTIFICATION_SERVICE_TOKEN", "")}`,
        })
        .json(notifications)
    )
  }

  async sendEventStartsSoon(
    event: EventAttributes,
    attendees: EventAttendeeAttributes[]
  ) {
    const link = new URL(Notifications.ExplorerURL)
    link.searchParams.append("position", `${event.x},${event.y}`)

    if (event.server) {
      link.searchParams.append("realm", event.server)
    }

    const common = {
      eventKey: event.id,
      type: EventsNotifications.EVENT_STARTS_SOON,
      timestamp: Date.now(),
      metadata: {
        title: "Event starts in an hour",
        description: `The event ${event.name} starts in an hour.`,
        link: link.toString(),
        startsAt: event.start_at.toISOString(),
        endsAt: event.finish_at.toISOString(),
        image: event.image || "",
        name: event.name,
      },
    } as const

    const notifications: EventStartsSoonNotification[] = attendees.map(
      (attendee) => ({
        ...common,
        metadata: common.metadata,
        address: attendee.user,
      })
    )

    return this.sendNotification<EventStartsSoonNotification>(notifications)
  }

  async sendEventStarted(
    event: EventAttributes,
    attendees: EventAttendeeAttributes[],
    options: {
      isLinkedToCommunity: boolean
      communityName?: string
    } = {
      isLinkedToCommunity: false,
    }
  ) {
    const link = new URL("https://play.decentraland.org/")
    link.searchParams.append("position", `${event.x},${event.y}`)

    if (event.server) {
      link.searchParams.append("realm", event.server)
    }

    const common = {
      eventKey: event.id,
      type: EventsNotifications.EVENT_STARTED,
      timestamp: Date.now(),
      metadata: {
        title: options.isLinkedToCommunity
          ? "Community Event starting"
          : "Event started",
        description:
          options.isLinkedToCommunity && options.communityName
            ? `A ${options.communityName} event is about to start.`
            : `The event ${event.name} has begun!`,
        link: link.toString(),
        name: event.name,
        image: event.image || "",
      },
    } as const

    const notifications: EventStartedNotification[] = attendees.map(
      (attendee) => ({
        ...common,
        metadata: common.metadata,
        address: attendee.user,
      })
    )

    return this.sendNotification<EventStartedNotification>(notifications)
  }

  // async sendEventCreated(
  //   event: EventAttributes,
  //   attendees: EventAttendeeAttributes[]
  // ) {
  //   /* TODO:
  //    * this should be reported to SNS every time an event is created
  //    * and services listening to this event should decide what to do with
  //    * this event. This filter is a temporary solution since we only need
  //    * to notify users about created events linked to a community.
  //    * After refactoring to event-driven approach, we should always report it
  //    * and filter on listeners side.
  //    */
  //   if (!event.community_id) {
  //     return
  //   }

  //   const link = new URL("https://play.decentraland.org/")
  //   link.searchParams.append("position", `${event.x},${event.y}`)

  //   if (event.server) {
  //     link.searchParams.append("realm", event.server)
  //   }

  //   const common = {
  //     eventKey: event.id,
  //     type: EventsNotifications.EVENT_CREATED,
  //     timestamp: Date.now(),
  //   } as const

  //   const notifications: EventCreatedNotification[] = attendees.map(
  //     (attendee) => ({
  //       ...common,
  //       metadata: common.metadata,
  //       address: attendee.user,
  //     })
  //   )

  //   return this.sendNotification<EventCreatedNotification>(notifications)
  // }
}
