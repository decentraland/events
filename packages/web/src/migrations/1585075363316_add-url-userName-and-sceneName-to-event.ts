import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    url: {
      type: "TEXT",
      default: null,
    },
    scene_name: {
      type: "TEXT",
      default: null,
    },
    user_name: {
      type: "TEXT",
      default: null,
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ["url", "user_name", "scene_name"])
}
