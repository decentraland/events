/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../entities/Event/model'

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(Model.tableName, 'realm', 'server')
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(Model.tableName, 'server', 'realm')
}
