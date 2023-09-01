import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventModel from "../entities/Event/model"
import Model from "../entities/EventCategory/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(Model.tableName, {
    name: {
      primaryKey: true,
      type: "VARCHAR(50)",
      notNull: true,
    },
    active: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
    updated_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
  })

  pgm.addColumns(EventModel.tableName, {
    categories: {
      type: "VARCHAR(50)[]",
      notNull: true,
      default: "{}",
    },
  })

  const tagIds = [
    "art",
    "causes",
    "competition",
    "education",
    "gambling",
    "gaming",
    "giveaway",
    "health",
    "hobbies",
    "identity",
    "live",
    "music",
    "networking",
    "nft",
    "other",
    "party",
    "play",
    "poap",
    "religion",
    "shopping",
    "social",
    "sports",
    "talks",
    "town",
    "tv",
  ]

  for (const element of tagIds) {
    pgm.sql(`
    INSERT INTO "${Model.tableName}" (name, active)
    VALUES ('${element}', TRUE)
    `)
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(Model.tableName)
  pgm.dropColumns(EventModel.tableName, ["categories"])
}
