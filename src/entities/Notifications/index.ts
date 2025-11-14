// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  EventCreatedEvent,
  EventEndedEvent,
  EventStartedEvent,
  EventStartsSoonEvent,
  Events,
} from "@dcl/schemas"
import env from "decentraland-gatsby/dist/utils/env"

import { createSnsPublisher } from "./sns"
import { EventAttributes } from "../Event/types"
import { EventAttendeeAttributes } from "../EventAttendee/types"

const JumpInSiteURL = env("JUMP_IN_SITE_URL", "https://decentraland.org/jump")

/**
 * Sends notifications via SNS publisher
 */
async function sendNotification<T>(notifications: T[]) {
  const { publishMessages } = createSnsPublisher()
  // Cast to any because SNS publisher accepts schema event union and our
  // notifications here match the expected shape (type + payload)
  return publishMessages(notifications as unknown as any[])
}

function buildEventLink(event: EventAttributes) {
  const link = new URL(`${JumpInSiteURL}/events`)
  link.searchParams.append("id", event.id)
  link.searchParams.append("position", `${event.x},${event.y}`)

  if (event.server) {
    link.searchParams.append("realm", event.server)
  }
  return link.toString()
}

/**
 * Creates event starts soon notifications for attendees
 */
export async function sendEventStartsSoon(
  event: EventAttributes,
  attendees: EventAttendeeAttributes[]
) {
  const link = buildEventLink(event)

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

  return sendNotification<EventStartsSoonEvent>(notifications)
}

/**
 * Creates event started notifications for attendees
 */
export async function sendEventStarted(
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
  const link = buildEventLink(event)

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

  return sendNotification<EventStartedEvent>(notifications)
}

/**
 * Creates event created notifications for community members
 * This notification is only sent to community members
 */
export async function sendEventCreated(
  event: EventAttributes,
  attendees: EventAttendeeAttributes[],
  options: {
    communityId: string
    communityName: string
    communityThumbnail?: string
  }
) {
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

  return sendNotification<EventCreatedEvent>(notifications)
}

/**
 * Creates event ended notification object
 * This is a single system event notification (not per attendee)
 */
function createEventEndedNotification(
  event: Pick<EventAttributes, "id" | "community_id">,
  attendeeCount: number
): EventEndedEvent {
  return {
    type: Events.Type.EVENT,
    subType: Events.SubType.Event.EVENT_ENDED,
    key: event.id,
    timestamp: Date.now(),
    metadata: {
      totalAttendees: attendeeCount,
      ...(event.community_id && { communityId: event.community_id }),
    },
  }
}

/**
 * Sends event ended notifications in batch
 */
export async function sendEventEnded(
  event: Pick<EventAttributes, "id" | "community_id">,
  attendeeCount: number
) {
  const notification = createEventEndedNotification(event, attendeeCount)
  return sendNotification<EventEndedEvent>([notification])
}

/**
 * Sends multiple event ended notifications in batch
 */
export async function sendEventsEnded(
  events: Array<{
    event: Pick<EventAttributes, "id" | "community_id">
    attendeeCount: number
  }>
) {
  const notifications = events.map(({ event, attendeeCount }) =>
    createEventEndedNotification(event, attendeeCount)
  )
  return sendNotification<EventEndedEvent>(notifications)
}
