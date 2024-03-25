/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventNotificationsModel from "../entities/EventNotifications/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(EventNotificationsModel.tableName, {
    event_id: {
      type: "UUID",
      primaryKey: true,
    },
    notification_type: {
      type: "TEXT",
      primaryKey: true,
    },
    created_at: {
      type: "TIMESTAMP",
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(EventNotificationsModel.tableName)
}
