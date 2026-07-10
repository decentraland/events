/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(Model.tableName, {
    time_slots: { type: "JSONB", notNull: true, default: "[]" },
  })

  pgm.sql(`
    UPDATE "${Model.tableName}"
    SET "time_slots" = jsonb_build_array(
      jsonb_build_object(
        'time',
        (
          EXTRACT(HOUR FROM "start_at" AT TIME ZONE 'UTC') * 60 +
          EXTRACT(MINUTE FROM "start_at" AT TIME ZONE 'UTC')
        )::int,
        'duration',
        "duration"
      )
    )
    WHERE "time_slots" = '[]'::jsonb;
  `)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(Model.tableName, "time_slots")
}
