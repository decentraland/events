import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate"

export const shorthands: ColumnDefinitions | undefined = undefined

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn(Model.tableName, {
        featured_item: { type: "TEXT", default: null },
    })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn(Model.tableName, "featured_item")
}