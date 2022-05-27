/* eslint-disable @typescript-eslint/camelcase */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    total_attendees: {
      type: "INT",
      notNull: true,
      default: 0,
    },
    latest_attendees: {
      type: "TEXT[]",
      notNull: true,
      default: "{0,0}",
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ["total_attendees", "latest_attendees"])
}
