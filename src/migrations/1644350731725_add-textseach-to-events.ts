/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate"
import EventModel from "../entities/Event/model"

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(EventModel.tableName, {
    textsearch: {
      type: 'tsvector',
      default: ""
    }
  })

  pgm.sql(`
    UPDATE "${EventModel.tableName}"
    SET "textsearch" = (
      setweight(to_tsvector("name"), 'A') ||
      setweight(to_tsvector("description"), 'C')
    )`
  )

  pgm.createIndex(EventModel.tableName, ["textsearch"], { method: 'gin' })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(EventModel.tableName, [ 'textsearch' ])
}
