/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(Model.tableName, {
    image_vertical: { type: "TEXT", default: null },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(Model.tableName, "image_vertical")
}
