/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../src/entities/Event/model'

export const shorthands: ColumnDefinitions | undefined = undefined;


export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    recurrent_setpos: {
      type: 'INTEGER',
      default: null
    },
    recurrent_monthday: {
      type: 'INTEGER',
      default: null
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ['recurrent_setpos', 'recurrent_monthday'])
}
