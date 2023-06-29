import { MigrationBuilder } from "node-pg-migrate"

import Model from "../entities/Event/model"

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(Model.tableName, "highlighted", "trending")
  pgm.addColumn(Model.tableName, {
    highlighted: {
      type: "BOOLEAN",
      default: false,
    },
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(Model.tableName, ["highlighted"])
  pgm.renameColumn(Model.tableName, "trending", "highlighted")
}
