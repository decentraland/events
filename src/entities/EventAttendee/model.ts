import isUUID from 'validator/lib/isUUID'
import { EventAttendeeAttributes } from './types'
import { SQL, table, values, join, limit, offset } from 'decentraland-gatsby/dist/entities/Database/utils'
import { Model } from 'decentraland-gatsby/dist/entities/Database/model'

const LATEST_EVENT_ATTENDING = 10

export default class EventAttendeeModel extends Model<EventAttendeeAttributes> {
  static tableName = 'event_attendees'
  static withTimestamps = false
  static primaryKey = 'event_id'

  static async unsubscribe(user: string) {
    return this.update<EventAttendeeAttributes>({ notify: false }, { user, notified: false })
  }

  static async setNotified(attendees: EventAttendeeAttributes[]) {
    if (attendees.length === 0) {
      return 0
    }

    const query = SQL`
      UPDATE ${table(EventAttendeeModel)}
      SET "notified" = TRUE
      WHERE
        ${join(attendees.map(attendee => SQL`("event_id" = ${attendee.event_id} AND "user" = ${attendee.user} )`), SQL` OR `)}
    `

    await this.query(query)

    return attendees.length
  }

  static async getPendingNotification(events: string[]) {
    if (events.length == 0) {
      return []
    }

    const query = SQL`
      SELECT *
      FROM ${table(EventAttendeeModel)}
      WHERE
        "event_id" IN ${values(events)}
        AND "notify" = TRUE
        AND "notified" = FALSE
    `

    return EventAttendeeModel.query<EventAttendeeAttributes>(query)
  }

  static async listByEventId(eventId: string, options: { limit?: number, offset?: number } = {}) {
    if (!isUUID(eventId)) {
      return []
    }

    const query = SQL`
      SELECT "event_id", "user", "user_name", "notify", "created_at"
      FROM ${table(EventAttendeeModel)}
      WHERE "event_id" = ${eventId}
      ORDER BY created_at DESC
      ${limit(options.limit, { max: 500, defaultValue: 500 })}
      ${offset(options.offset)}
    `

    return EventAttendeeModel.query<EventAttendeeAttributes>(query)
  }

  static async latest(eventId: string) {
    const attendees = await this.listByEventId(eventId, { limit: LATEST_EVENT_ATTENDING, offset: 0 })
    return attendees.map(attendee => attendee.user)
  }
}