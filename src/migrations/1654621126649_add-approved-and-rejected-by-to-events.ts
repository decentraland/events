/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate"
import { Type } from "decentraland-gatsby/dist/entities/Database/types"
import EventModel from "../entities/Event/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventModel.tableName, {
    approved_by: {
      type: Type.Address,
      default: null,
    },
    rejected_by: {
      type: Type.Address,
      default: null,
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(EventModel.tableName, ["approved_by", "rejected_by"])
}
