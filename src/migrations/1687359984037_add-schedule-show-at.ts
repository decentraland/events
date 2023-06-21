import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Schedule/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    event_since: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
    event_until: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
  })
  pgm.sql(`
      UPDATE ${Model.tableName} SET
      active_since=event_since, active_until=event_until
    `)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ["event_since", "event_until"])
}
