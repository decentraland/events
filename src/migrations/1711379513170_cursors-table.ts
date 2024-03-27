/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder, PgType } from "node-pg-migrate"

import NotificationCursorsModel from "../entities/NotificationCursors/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(NotificationCursorsModel.tableName, {
    id: { type: PgType.VARCHAR, notNull: true, primaryKey: true },
    last_successful_run_at: { type: PgType.BIGINT, notNull: false },
    created_at: { type: PgType.BIGINT, notNull: true },
    updated_at: { type: PgType.BIGINT, notNull: true },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(NotificationCursorsModel.tableName)
}
