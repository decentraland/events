/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Step 1: Add previous_place_id column to preserve old values for rollback
  pgm.addColumn(Model.tableName, {
    previous_place_id: { type: "TEXT", default: null },
  })

  // Step 2: Store current place_id before overwriting (only for world events being migrated)
  pgm.sql(`
    UPDATE "${Model.tableName}"
    SET "previous_place_id" = "place_id"
    WHERE "world" IS TRUE
      AND "server" IS NOT NULL
      AND "server" != ''
      AND "place_id" IS NOT NULL
      AND "place_id" != LOWER("server");
  `)

  // Step 3: Set place_id = LOWER(server) for world events not yet migrated
  pgm.sql(`
    UPDATE "${Model.tableName}"
    SET "place_id" = LOWER("server")
    WHERE "world" IS TRUE
      AND "server" IS NOT NULL
      AND "server" != ''
      AND ("place_id" IS NULL OR "place_id" != LOWER("server"));
  `)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Restore original place_id values from previous_place_id
  pgm.sql(`
    UPDATE "${Model.tableName}"
    SET "place_id" = "previous_place_id"
    WHERE "world" IS TRUE
      AND "previous_place_id" IS NOT NULL;
  `)

  // Drop the rollback column
  pgm.dropColumn(Model.tableName, "previous_place_id")
}
