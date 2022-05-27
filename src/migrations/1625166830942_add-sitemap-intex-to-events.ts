/* eslint-disable @typescript-eslint/camelcase */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex(Model.tableName, ["approved", "created_at"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(Model.tableName, ["approved", "created_at"])
}
