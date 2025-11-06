// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NotificationType } from "@dcl/schemas"

export const EVENTS_ENDED = "events_ended" as const

export type EventsNotifications =
  | NotificationType.EVENTS_STARTED
  | NotificationType.EVENT_CREATED
  | NotificationType.EVENTS_STARTS_SOON
  | typeof EVENTS_ENDED
