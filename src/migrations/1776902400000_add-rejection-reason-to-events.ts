import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventModel from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventModel.tableName, {
    rejection_reason: {
      type: "TEXT",
      notNull: false,
      default: null,
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(EventModel.tableName, ["rejection_reason"])
}
