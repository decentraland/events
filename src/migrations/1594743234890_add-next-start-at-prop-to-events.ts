/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../entities/Event/model'

export const shorthands: ColumnDefinitions | undefined = undefined;


export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    next_start_at: {
      type: 'TIMESTAMPTZ',
      default: null
    },
  })

  pgm.createIndex(Model.tableName, ['next_start_at'])
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(Model.tableName, ['next_start_at'])
  pgm.dropColumns(Model.tableName, ['next_start_at'])
}
