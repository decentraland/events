import { Type } from "decentraland-gatsby/dist/entities/Database/types"
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Schedule/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(Model.tableName, "description", {
    notNull: false,
  })

  pgm.alterColumn(Model.tableName, "image", {
    notNull: false,
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
