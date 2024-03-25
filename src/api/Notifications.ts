import API from "decentraland-gatsby/dist/utils/api/API"
import env from "decentraland-gatsby/dist/utils/env"

type DCLNotification<T, M> = {
  eventKey: string
  type: T
  address?: string
  metadata: M & { title: string; description: string }
  timestamp: number
}

export enum EventsNotifications {
  EVENT_STARTS_SOON = "events_starts_soon",
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
    `https://notifications-processor.decentraland.io`
  )
  static Token = env("NOTIFICATION_SERVICE_TOKEN", "")

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

  private async sendNotification<T>(notification: T) {
    return this.fetch(
      "/notifications",
      this.options()
        .method("POST")
        .headers({
          Authorization: `Bearer ${env("NOTIFICATION_SERVICE_TOKEN", "")}`,
        })
        .json([notification])
    )
  }

  async sendEventStartsSoon({
    address,
    x,
    y,
    id,
    name,
    image,
    startsAt,
    endsAt,
    server,
  }: {
    address: string
    x: number
    y: number
    server: string | null
    id: string
    name: string
    image: string
    startsAt: string
    endsAt: string
  }) {
    const link = new URL("https://play.decentraland.org/")
    link.searchParams.append("position", `${x},${y}`)

    if (server) {
      link.searchParams.append("realm", server)
    }

    return this.sendNotification<EventStartsSoonNotification>({
      address,
      eventKey: `${id}-${address}`,
      metadata: {
        name,
        image,
        startsAt,
        endsAt,
        link: link.toString(),
        title: "Event starts in an hour",
        description: `The event ${name} starts in an hour`,
      },
      type: EventsNotifications.EVENT_STARTS_SOON,
      timestamp: Date.now(),
    })
  }

  async sendEventStarted({
    address,
    x,
    y,
    id,
    name,
    image,
    server,
  }: {
    address: string
    x: number
    y: number
    server: string | null
    id: string
    name: string
    image: string
  }) {
    const link = new URL("https://play.decentraland.org/")
    link.searchParams.append("position", `${x},${y}`)

    if (server) {
      link.searchParams.append("realm", server)
    }

    return this.sendNotification<EventStartedNotification>({
      address,
      eventKey: `${id}-${address}`,
      metadata: {
        name,
        image,
        link: link.toString(),
        title: "Event started",
        description: `The event ${name} has begun!`,
      },
      type: EventsNotifications.EVENT_STARTED,
      timestamp: Date.now(),
    })
  }
}
