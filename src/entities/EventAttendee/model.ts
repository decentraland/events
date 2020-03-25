import { Model, SQL, raw } from 'decentraland-server'
import isUUID from 'validator/lib/isUUID'
import { EventAttendeeAttributes } from './types'
import { table, conditional } from '../Database/utils'

const LATEST_EVENT_ATTENDING = 10

export default class EventAttendee extends Model<{}> {
  static tableName = 'event_attendees'
  static withTimestamps = false
  static primaryKey = 'event_id'

  static async getList(eventId: string, limit?: number) {
    if (!isUUID(eventId)) {
      return []
    }

    const attendees = await EventAttendee.query<EventAttendeeAttributes>(SQL`
      SELECT *
      FROM ${table(EventAttendee)}
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      ${conditional(!!limit, SQL`LIMIT ${limit}`)}
    `)

    return attendees.map(attendee => attendee.user)
  }

  static async latest(eventId: string) {
    return this.getList(eventId, LATEST_EVENT_ATTENDING)
  }
}