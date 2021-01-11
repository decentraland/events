/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../entities/Event/model'

export const shorthands: ColumnDefinitions | undefined = undefined;


export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(Model.tableName, ['active_until'], { ifExists: true })
  pgm.dropColumn(Model.tableName, 'active_until', { ifExists: true })
  pgm.addColumns(Model.tableName, {
    duration: {
      type: 'INTEGER',
      notNull: true,
      default: '0'
    },
    recurrent_dates: {
      type: 'TIMESTAMP[]',
      notNull: true,
      default: '{}'
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ['duration', 'recurrent_dates'])
}
