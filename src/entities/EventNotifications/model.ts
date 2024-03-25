import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import {
  SQL,
  columns,
  objectValues,
  table,
} from "decentraland-gatsby/dist/entities/Database/utils"

import { EventsNotifications } from "../../api/Notifications"

export default class EventNotificationsModel extends Model<{}> {
  static tableName = "event_notifications"
  static primaryKey = "event_id"

  static async notificationSent(
    eventId: string,
    notificationType: EventsNotifications
  ) {
    const values = {
      event_id: eventId,
      notification_type: notificationType,
      created_at: new Date(),
    }
    const tableColumns = Object.keys(values)
    const query = SQL`INSERT INTO ${table(EventNotificationsModel)} ${columns(
      tableColumns
    )} VALUES ${objectValues(tableColumns, [values])}`

    return await this.namedQuery("notificationSent", query)
  }
}
