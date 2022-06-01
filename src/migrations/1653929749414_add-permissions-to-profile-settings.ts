/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate"
import { Type } from "decentraland-gatsby/dist/entities/Database/types"
import ProfileSettings from "../entities/ProfileSettings/model"
import { listAdmins } from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { ProfilePermissions } from "../entities/ProfileSettings/types"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(ProfileSettings.tableName, {
    permissions: {
      type: Type.Array(Type.Varchar(25)),
      notNull: true,
      default: "{}",
    },
    created_at: {
      type: Type.TimeStampTZ,
      notNull: true,
      default: "now()",
    },
    updated_at: {
      type: Type.TimeStampTZ,
      notNull: true,
      default: "now()",
    },
  })

  const admins = listAdmins()
  const permissions = [
    ProfilePermissions.ApproveOwnEvent,
    ProfilePermissions.ApproveAnyEvent,
    ProfilePermissions.EditAnyEvent,
    ProfilePermissions.EditAnySchedule,
    ProfilePermissions.EditAnyProfile,
  ]

  pgm.sql(`
    UPDATE ${ProfileSettings.tableName}
    SET "permissions" = ARRAY[${permissions
      .map((permission) => `'${permission}'`)
      .join(", ")}]
    WHERE "user" in (${admins.map((admin) => `'${admin}'`).join(", ")})
  `)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(ProfileSettings.tableName, [
    "permissions",
    "created_at",
    "updated_at",
  ])
}
