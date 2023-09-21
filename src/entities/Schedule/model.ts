import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import {
  SQL,
  table,
  values,
} from "decentraland-gatsby/dist/entities/Database/utils"
import Time from "decentraland-gatsby/dist/utils/date/Time"

import { ScheduleAttributes } from "./types"

export default class ScheduleModel extends Model<ScheduleAttributes> {
  static tableName = "schedule"
  static primaryKey = "id"

  static async getSchedules() {
    const now = Time.from()
    const query = SQL`SELECT * FROM ${table(this)}
      WHERE "active_until" > ${now}`
    return this.namedQuery<ScheduleAttributes[]>("get_schedules", query)
  }

  static async getScheduleList(ids: string[]) {
    const query = SQL`SELECT * FROM ${table(this)} WHERE "id" in ${values(ids)}`
    return this.namedQuery<ScheduleAttributes>("get_schedule_list", query)
  }
}
