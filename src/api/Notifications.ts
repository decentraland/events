// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  EventCreatedEvent,
  EventStartedEvent,
  EventStartsSoonEvent,
  Events,
  NotificationType,
} from "@dcl/schemas"
import API from "decentraland-gatsby/dist/utils/api/API"
import env from "decentraland-gatsby/dist/utils/env"

import { EventAttributes } from "../entities/Event/types"
import { EventAttendeeAttributes } from "../entities/EventAttendee/types"
import { createSnsPublisher } from "../utils/sns"

type DCLNotification<T, M> = {
  eventKey: string
  type: T
  address?: string
  metadata: M & { title: string; description: string }
  timestamp: number
}

export type EventsNotifications =
  | NotificationType.EVENTS_STARTED
  | NotificationType.EVENT_CREATED
  | NotificationType.EVENTS_STARTS_SOON

export type EventStartsSoonNotification = DCLNotification<
  NotificationType.EVENTS_STARTS_SOON,
  {
    name: string
    image: string
    link: string
    startsAt: string
    endsAt: string
  }
>

export type EventStartedNotification = DCLNotification<
  NotificationType.EVENTS_STARTED,
  {
    name: string
    image: string
    link: string
  }
>

export type EventCreatedNotification = DCLNotification<
  NotificationType.EVENT_CREATED,
  {
    name: string
    image: string
    communityId?: string
    communityName?: string
    communityThumbnail?: string
  }
>
export default class Notifications extends API {
  static Url = env(
    "NOTIFICATION_SERVICE_URL",
    `https://notifications-processor.decentraland.zone`
  )
  static Token = env("NOTIFICATION_SERVICE_TOKEN", "")
  static JumpInSiteURL = env(
    "JUMP_IN_SITE_URL",
    "https://decentraland.org/jump"
  )

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
    const { publishMessages } = createSnsPublisher()
    // Cast to any because SNS publisher accepts schema event union and our
    // notifications here match the expected shape (type + payload)
    return publishMessages(notifications as unknown as any[])
  }

  async sendEventStartsSoon(
    event: EventAttributes,
    attendees: EventAttendeeAttributes[]
  ) {
    const link = new URL(`${Notifications.JumpInSiteURL}/events`)
    link.searchParams.append("id", event.id)

    if (event.server) {
      link.searchParams.append("realm", event.server)
    }

    const notifications: EventStartsSoonEvent[] = attendees.map((attendee) => ({
      type: Events.Type.EVENT,
      subType: Events.SubType.Event.EVENT_STARTS_SOON,
      key: event.id,
      timestamp: Date.now(),
      metadata: {
        title: "Event starts in an hour",
        description: `The event ${event.name} starts in an hour.`,
        link: link.toString(),
        startsAt: event.start_at.toISOString(),
        endsAt: event.finish_at.toISOString(),
        image: event.image || "",
        name: event.name,
        attendee: attendee.user,
      },
    }))

    return this.sendNotification<EventStartsSoonEvent>(notifications)
  }

  async sendEventStarted(
    event: EventAttributes,
    attendees: EventAttendeeAttributes[],
    options: {
      isLinkedToCommunity: boolean
      communityName?: string
      communityThumbnail?: string
    } = {
      isLinkedToCommunity: false,
    }
  ) {
    const link = new URL(`${Notifications.JumpInSiteURL}/events`)
    link.searchParams.append("id", event.id)

    if (event.server) {
      link.searchParams.append("realm", event.server)
    }

    const notifications: EventStartedEvent[] = attendees.map((attendee) => ({
      type: Events.Type.EVENT,
      subType: Events.SubType.Event.EVENT_STARTED,
      key: event.id,
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
        communityThumbnail: options.communityThumbnail,
        attendee: attendee.user,
      },
    }))

    return this.sendNotification<EventStartedEvent>(notifications)
  }

  // this notification is only sent to community members
  async sendEventCreated(
    event: EventAttributes,
    attendees: EventAttendeeAttributes[],
    options: {
      communityId: string
      communityName: string
      communityThumbnail?: string
    }
  ) {
    const link = new URL(`${Notifications.JumpInSiteURL}/events`)
    link.searchParams.append("id", event.id)

    if (event.server) {
      link.searchParams.append("realm", event.server)
    }

    const notifications: EventCreatedEvent[] = attendees.map((attendee) => ({
      type: Events.Type.EVENT,
      subType: Events.SubType.Event.EVENT_CREATED,
      key: event.id,
      timestamp: Date.now(),
      metadata: {
        title: "Community Event Added",
        description: `The ${options.communityName} Community has added a new event.`,
        name: event.name,
        image: event.image || "",
        communityId: options.communityId,
        communityName: options.communityName,
        communityThumbnail: options.communityThumbnail,
        attendee: attendee.user,
      },
    }))

    return this.sendNotification<EventCreatedEvent>(notifications)
  }
}
