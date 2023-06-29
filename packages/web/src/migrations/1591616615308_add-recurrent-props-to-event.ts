import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

const columns: ColumnDefinitions = {
  recurrent: {
    type: "BOOL",
    notNull: true,
    default: false,
  },
  recurrent_frequency: {
    type: "TEXT",
    default: null,
  },
  recurrent_weekday_mask: {
    type: "INTEGER",
    notNull: true,
    default: 0,
  },
  recurrent_month_mask: {
    type: "INTEGER",
    notNull: true,
    default: 0,
  },
  recurrent_interval: {
    type: "INTEGER",
    notNull: true,
    default: 1,
  },
  recurrent_count: {
    type: "INTEGER",
    default: null,
  },
  recurrent_until: {
    type: "TIMESTAMP",
    default: null,
  },
  active_until: {
    type: "TIMESTAMP",
    notNull: true,
    default: "now()",
  },
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, columns)
  pgm.createIndex(Model.tableName, ["active_until"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, Object.keys(columns))
}
