import Time from "decentraland-gatsby/dist/utils/date/Time"
import { ScheduleAttributes } from "./types"

const mock: ScheduleAttributes[] = [
  {
    id: "ea869a5a-4201-45d9-beda-7ffb07f8a88a",
    name: "Pride month 2022",
    description: "Pride month description",
    image: "",
    active_since: Time.from("2022-06-01 00:00:00").toDate(),
    active_until: Time.from("2022-07-01 00:00:00").toDate(),
  },
]

export default class ScheduleModel {
  static async getSchedules() {
    const now = Time.from()
    return mock.filter((schedule) => now.isBefore(schedule.active_until))
  }

  static async findOne(filters: { id: string }) {
    return mock.find((schedule) => schedule.id === filters.id) || null
  }

  static async getScheduleList(ids: string[]) {
    const list = new Set(ids)
    return mock.filter((schedule) => list.has(schedule.id))
  }
}
