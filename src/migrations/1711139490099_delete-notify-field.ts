/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventAttendeeModel from "../entities/EventAttendee/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(EventAttendeeModel.tableName, [
    "event_id",
    "notify",
    "notified",
  ])
  pgm.dropColumns(EventAttendeeModel.tableName, ["notify", "notified"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventAttendeeModel.tableName, {
    notify: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
    notified: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
  })

  pgm.addIndex(EventAttendeeModel.tableName, ["event_id", "notify", "notified"])
}
