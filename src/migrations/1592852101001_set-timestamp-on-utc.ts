/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate"
import EventModel from "../entities/Event/model"
import EventAttendeeModel from "../entities/EventAttendee/model"

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(EventModel.tableName, "start_at", { type: "TIMESTAMPTZ" })
  pgm.alterColumn(EventModel.tableName, "finish_at", { type: "TIMESTAMPTZ" })
  pgm.alterColumn(EventModel.tableName, "created_at", { type: "TIMESTAMPTZ" })
  pgm.alterColumn(EventModel.tableName, "updated_at", { type: "TIMESTAMPTZ" })
  pgm.alterColumn(EventModel.tableName, "recurrent_until", {
    type: "TIMESTAMPTZ",
  })
  pgm.alterColumn(EventModel.tableName, "recurrent_dates", {
    type: "TIMESTAMPTZ[]",
  })

  pgm.alterColumn(EventAttendeeModel.tableName, "created_at", {
    type: "TIMESTAMPTZ",
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
