/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(Model.tableName, {
    community_id: { type: "TEXT", default: null },
  })
  pgm.createIndex(Model.tableName, "community_id")
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(Model.tableName, "community_id")
  pgm.dropColumn(Model.tableName, "community_id")
}
