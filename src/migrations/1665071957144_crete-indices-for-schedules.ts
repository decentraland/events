/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

import ScheduleModel from "../entities/Schedule/model"

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex(ScheduleModel.tableName, ["active_until"])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(ScheduleModel.tableName, ["active_until"])
}
