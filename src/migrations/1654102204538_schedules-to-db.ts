/* eslint-disable @typescript-eslint/naming-convention */
import { Type } from "decentraland-gatsby/dist/entities/Database/types"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate"
import EventModel from "../entities/Event/model"
import Model from "../entities/Schedule/model"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(Model.tableName, {
    id: {
      primaryKey: true,
      type: Type.UUID,
      notNull: true,
    },
    name: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    description: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    background: {
      type: "VARCHAR(30)[]",
      notNull: true,
    },
    image: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    active_since: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
    active_until: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
    active: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
    updated_at: {
      type: "TIMESTAMPTZ",
      notNull: true,
      default: "now()",
    },
  })

  pgm.sql(`
  INSERT INTO "${
    Model.tableName
  }" (id,name,description,background,image,active_since,active_until,active)
  VALUES (
    'ea869a5a-4201-45d9-beda-7ffb07f8a88a', 
    'Pride month 2022', 
    'Join us for pride month. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.', 
    '{
      "rgba(255, 188, 91, .1)",
      "rgba(252, 153, 101, .1)",
      "rgba(255, 116, 57, .1)",
      "rgba(255, 46, 84, .1)",
      "rgba(198, 64, 205, .1)",
      "rgba(165, 36, 179, .1)",
      "rgba(105, 31, 169, .1)"
    }',
    'https://decentraland.org/blog/images/static/images/pride-4be984a59111e68fb428a3ec060c2f07.jpg',
    '${Time.from("2022-06-01 00:00:00")}',
    '${Time.from("2022-07-01 00:00:00")}',
    TRUE
  )`)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(Model.tableName)
}
