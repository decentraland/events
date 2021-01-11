/* eslint-disable @typescript-eslint/camelcase */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';
import Model from '../entities/ProfileSettings/model'

export const shorthands: ColumnDefinitions | undefined = undefined;


export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(Model.tableName, {
    email_verified_at: {
      type: 'TIMESTAMPTZ',
      default: null
    },
    email_updated_at: {
      type: 'TIMESTAMPTZ',
      default: null
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ['email_verified_at', 'email_updated_at'])
}
