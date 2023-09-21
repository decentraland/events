import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventModel from "../entities/Event/model"

export const shorthands: ColumnDefinitions = {
  world: {
    type: "BOOLEAN",
    notNull: true,
    default: false,
  },
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventModel.tableName, shorthands)
  pgm.addIndex(EventModel.tableName, ["world", "created_at"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(EventModel.tableName, Object.keys(shorthands))
  pgm.dropIndex(EventModel.tableName, ["world", "created_at"])
}
