import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import {
  SQL,
  limit,
  offset,
  table,
} from "decentraland-gatsby/dist/entities/Database/utils"
import isUUID from "validator/lib/isUUID"

import { EventAttendeeAttributes } from "./types"

const LATEST_EVENT_ATTENDING = 10

export default class EventAttendeeModel extends Model<EventAttendeeAttributes> {
  static tableName = "event_attendees"
  static withTimestamps = false
  static primaryKey = "event_id"

  static async listByEventId(
    eventId: string,
    options: { limit?: number | null; offset?: number } = {}
  ) {
    if (!isUUID(eventId)) {
      return []
    }

    const query = SQL`
      SELECT "event_id", "user", "user_name", "created_at"
      FROM ${table(EventAttendeeModel)}
      WHERE "event_id" = ${eventId}
      ORDER BY created_at DESC
      ${limit(options.limit, { max: 500, defaultValue: 500 })}
      ${offset(options.offset)}
    `

    return EventAttendeeModel.query<EventAttendeeAttributes>(query)
  }

  static async latest(eventId: string) {
    const attendees = await this.listByEventId(eventId, {
      limit: LATEST_EVENT_ATTENDING,
      offset: 0,
    })
    return attendees.map((attendee) => attendee.user)
  }
}
