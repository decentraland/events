import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import { SQL, table } from "decentraland-gatsby/dist/entities/Database/utils"

import { EventsNotifications } from "../../Notifications/types"

export default class NotificationCursorsModel extends Model<{}> {
  static tableName = "notification_cursors"

  static async updateLastUpdateForNotificationType(
    notificationType: EventsNotifications,
    timestamp: number
  ) {
    const query = SQL`
        INSERT INTO ${table(
          this
        )} (id, last_successful_run_at, created_at, updated_at)
        VALUES (${notificationType}, ${timestamp}, ${Date.now()}, ${Date.now()})
        ON CONFLICT (id) DO UPDATE
        SET last_successful_run_at = ${timestamp},
            updated_at             = ${Date.now()};
    `

    return this.namedQuery("update_last_update_for_notification_type", query)
  }

  static async getLastUpdateForNotificationType(
    notificationType: EventsNotifications
  ) {
    const result = await this.namedQuery<{
      last_successful_run_at: number
    }>(
      "get_last_update_for_notification_type",
      SQL`
        SELECT *
        FROM ${table(this)}
        WHERE id = ${notificationType};
    `
    )

    if (result.length === 0) {
      return Date.now()
    }

    return Number(result[0].last_successful_run_at)
  }
}
