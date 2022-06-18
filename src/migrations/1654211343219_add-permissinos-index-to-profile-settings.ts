/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import ProfileSettings from "../entities/ProfileSettings/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex(ProfileSettings.tableName, ["permissions"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(ProfileSettings.tableName, ["permissions"])
}
