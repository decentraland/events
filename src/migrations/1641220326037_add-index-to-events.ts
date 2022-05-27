/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventModel from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventModel.tableName, {
    next_finish_at: {
      type: "TIMESTAMPTZ",
      default: null,
    },
  })

  pgm.createIndex(EventModel.tableName, [
    "rejected",
    "approved",
    "user",
    "next_finish_at",
  ])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(EventModel.tableName, [
    "rejected",
    "approved",
    "user",
    "next_finish_at",
  ])
}
