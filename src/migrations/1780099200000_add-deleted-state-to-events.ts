import { Type } from "decentraland-gatsby/dist/entities/Database/types"
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import EventModel from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventModel.tableName, {
    deleted_by_user: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
    deleted_by_admin: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
    deleted_by: {
      type: Type.Address,
      default: null,
    },
    deleted_at: {
      type: "TIMESTAMP",
      notNull: false,
      default: null,
    },
    deleted_reason: {
      type: "TEXT",
      notNull: false,
      default: null,
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(EventModel.tableName, [
    "deleted_by_user",
    "deleted_by_admin",
    "deleted_by",
    "deleted_at",
    "deleted_reason",
  ])
}
