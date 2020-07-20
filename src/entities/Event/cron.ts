import JobContext from "decentraland-gatsby/dist/entities/Job/context";
import EventModel from "./model";
import EventAttendeeModel from "../EventAttendee/model";
import ProfileSettingsModel from "../ProfileSettings/model";
import ProfileSubscriptionModel from "../ProfileSubscription/model";
import { ProfileSubscriptionAttributes } from "../ProfileSubscription/types";
import { sendEmailUpcomingEvent } from "../Notification/utils";
import { ProfileSettingsAttributes } from "../ProfileSettings/types";
import push from "../Notification/push";
import { eventUrl } from "./utils";

export async function notifyUpcomingEvents(ctx: JobContext<{}>) {
  const events = await EventModel.getUpcomingEvents()
  ctx.log(`[${new Date().toJSON()}] ${events.length} events to notify`)

  if (events.length === 0) {
    return
  }

  // const eventMap = new Map(events.map(event => [event.id, event] as const))
  const attendees = await EventAttendeeModel.getPendingNotification(events.map(event => event.id))
  ctx.log(`${attendees.length} attendees to notify`)

  if (attendees.length === 0) {
    return
  }

  const user = attendees.map(attendee => attendee.user)
  const [settings, subscriptions] = await Promise.all([
    ProfileSettingsModel.findByUsers(user),
    ProfileSubscriptionModel.findByUsers(user),
  ])

  const settingMap = new Map(settings.map(setting => [setting.user, setting] as const))
  const subscriptionMap = new Map(subscriptions.map(subscription => [subscription.user, subscription] as const))
  const expiredSubscriptions: ProfileSubscriptionAttributes[] = []

  for (const event of events) {
    const eventAttendees = attendees.filter(attendee => attendee.event_id === event.id);

    const emailNotifications: ProfileSettingsAttributes[] = []
    const browserNotifications: ProfileSubscriptionAttributes[] = []

    for (const attendee of eventAttendees) {
      const settings = settingMap.get(attendee.user)
      const subscription = subscriptionMap.get(attendee.user)

      if (settings && settings.email_verified && settings.notify_by_email) {
        emailNotifications.push(settings)
      }

      if (settings && settings.notify_by_browser && subscription) {
        browserNotifications.push(subscription)
      }
    }

    ctx.log(`Notifying event ${event.id} (email: ${emailNotifications.length}, web: ${browserNotifications.length})`)
    const eventNotificationData = {
      title: event.name,
      href: eventUrl(event),
      tag: event.id,
      image: event.image!,
    }

    const notifications: Promise<any>[] = browserNotifications
      .map(async (subscription) => {
        return push(subscription, eventNotificationData)
          .catch((error) => {
            console.error(error)
            error.statusCode === 410 && expiredSubscriptions.push(subscription)
          })
      })

    notifications.push(sendEmailUpcomingEvent(event, emailNotifications))
    await Promise.all(notifications)
  }

  await EventAttendeeModel.setNotified(attendees)
  await ProfileSubscriptionModel.deleteAll(expiredSubscriptions)
}
