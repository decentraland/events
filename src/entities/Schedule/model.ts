import Time from "decentraland-gatsby/dist/utils/date/Time"
import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import { ScheduleAttributes } from "./types"
import { SQL, table } from "decentraland-gatsby/dist/entities/Database/utils"

export default class ScheduleModel extends Model<ScheduleAttributes> {
  static tableName = "schedule"
  static primaryKey = "id"

  static async getSchedules() {
    const now = Time.from()
    const query = SQL`SELECT * FROM ${table(
      ScheduleModel
    )} WHERE "active_until" > ${now}`
    const scheduleFound = await ScheduleModel.query<ScheduleAttributes[]>(query)

    return scheduleFound
  }

  static async getScheduleList(ids: string[]) {
    const query = SQL`SELECT count(*) FROM ${table(
      ScheduleModel
    )} WHERE "id" in ${ids}`
    const scheduleFound = await ScheduleModel.query<ScheduleAttributes>(query)

    return scheduleFound
  }
}
