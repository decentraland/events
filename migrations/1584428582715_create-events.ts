/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../src/entities/Event/model'

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {

  pgm.createTable(Model.tableName, {
    id: {
      primaryKey: true,
      type: 'UUID',
    },
    name: {
      type: 'TEXT',
      notNull: true
    },
    image: {
      type: 'TEXT',
      notNull: true,
    },
    description: {
      type: 'TEXT',
    },
    start_at: {
      type: 'TIMESTAMP',
      notNull: true
    },
    finish_at: {
      type: 'TIMESTAMP',
      notNull: true
    },
    coordinates: {
      type: 'INT[]',
      notNull: true,
      default: '{0,0}'
    },
    user: {
      type: 'TEXT',
      notNull: true
    },
    approved: {
      type: 'BOOLEAN',
      notNull: true,
      default: false
    },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: 'now()'
    },
    updated_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: 'now()'
    },
    contact: {
      type: 'TEXT',
    },
    details: {
      type: 'TEXT',
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(Model.tableName)
}
