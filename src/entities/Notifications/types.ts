// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { NotificationType } from "@dcl/schemas"

export type EventsNotifications =
  | NotificationType.EVENTS_STARTED
  | NotificationType.EVENT_CREATED
  | NotificationType.EVENTS_STARTS_SOON
