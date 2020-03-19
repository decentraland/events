import { Model, SQL, raw } from 'decentraland-server'
import isUUID from 'validator/lib/isUUID'
import { EventAttendeeAttributes } from './types'


export default class EventAttendee extends Model<{}> {
  tableName = 'event_attendees'

  static async latest(eventId: string) {
    if (!isUUID(eventId)) {
      return []
    }

    const latest = await EventAttendee.query<EventAttendeeAttributes>(SQL`
      SELECT *
      FROM ${raw(EventAttendee.tableName)}
      WHERE event_id = ${eventId}
      ORDER BY timestamp DESC
      LIMIT 5
    `)

    return latest.map(attending => attending.event_id)
  }
}