/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../src/entities/EventAttendee/model'

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(Model.tableName, {
    event_id: {
      type: 'UUID',
      primaryKey: true
    },
    user: {
      type: 'TEXT',
      primaryKey: true
    },
    created_at: {
      type: 'timestamp',
    }
  }, {
    temporary: false
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(Model.tableName)
}
