import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/EventAttendee/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    user_name: {
      type: "TEXT",
      default: null,
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ["user_name"])
}
