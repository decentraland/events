/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../entities/ProfileSubscription/model'

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(Model.tableName, {
    endpoint: {
      type: 'TEXT',
      primaryKey: true,
      notNull: true,
    },
    user: {
      type: 'TEXT',
      notNull: true
    },
    p256dh: {
      type: 'TEXT',
      notNull: true,
    },
    auth: {
      type: 'TEXT',
      notNull: true,
    }
  })

  pgm.createIndex(Model.tableName, ['user'])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(Model.tableName, { cascade: true })
}
