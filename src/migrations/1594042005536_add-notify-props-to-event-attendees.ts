import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/EventAttendee/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
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

  pgm.addIndex(Model.tableName, ["event_id", "notify", "notified"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(Model.tableName, ["event_id", "notify", "notified"])
  pgm.dropColumns(Model.tableName, ["notify", "notified"])
}
