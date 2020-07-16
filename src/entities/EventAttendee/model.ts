import { Model, SQL, raw } from 'decentraland-server'
import isUUID from 'validator/lib/isUUID'
import { EventAttendeeAttributes } from './types'
import { table, conditional, values, join } from 'decentraland-gatsby/dist/entities/Database/utils'

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
      SET notified = TRUE
      WHERE
        ${join(attendees.map(attendee => SQL`(event_id = ${attendee.event_id} AND user = ${attendee.user} )`), SQL` OR `)}
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
        event_id IN ${values(events)}
        AND notify = TRUE
        AND notified = FALSE
    `

    return EventAttendeeModel.query<EventAttendeeAttributes>(query)
  }

  static async getList(eventId: string, limit?: number) {
    if (!isUUID(eventId)) {
      return []
    }

    const query = SQL`
      SELECT *
      FROM ${table(EventAttendeeModel)}
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      ${conditional(!!limit, SQL`LIMIT ${limit}`)}
    `

    const attendees = await EventAttendeeModel.query<EventAttendeeAttributes>(query)

    return attendees.map(attendee => attendee.user)
  }

  static async latest(eventId: string) {
    return this.getList(eventId, LATEST_EVENT_ATTENDING)
  }
}