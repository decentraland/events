import { MigrationBuilder } from "node-pg-migrate"

import EventModel from "../entities/Event/model"

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE "${EventModel.tableName}"
    SET "next_start_at" = "start_at"
    WHERE "next_start_at" IS NULL;
  `)

  pgm.sql(`
    UPDATE "${EventModel.tableName}"
    SET "next_finish_at" = "next_start_at" + ("duration" * '1 millisecond'::interval)
    WHERE "next_finish_at" IS NULL;`)
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
