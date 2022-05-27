/* eslint-disable @typescript-eslint/camelcase */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(Model.tableName, "duration", {
    type: "BIGINT",
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // pgm.dropColumns(Model.tableName, ['duration', 'recurrent_dates'])
}
