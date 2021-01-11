/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../entities/ProfileSettings/model'

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(Model.tableName, {
    user: {
      type: 'TEXT',
      primaryKey: true,
      notNull: true,
    },

    email: { type: 'TEXT' },
    email_verified: { type: 'BOOLEAN', notNull: true, default: false },
    use_local_time: { type: 'BOOLEAN', notNull: true, default: false },
    notify_by_email: { type: 'BOOLEAN', notNull: true, default: false },
    notify_by_browser: { type: 'BOOLEAN', notNull: true, default: false },
  })

  pgm.createIndex(Model.tableName, ['email'])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(Model.tableName, { cascade: true })
}
