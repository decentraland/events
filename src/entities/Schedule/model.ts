import Time from "decentraland-gatsby/dist/utils/date/Time"
import { ScheduleAttributes } from "./types"

const mock: ScheduleAttributes[] = [
  {
    id: "ea869a5a-4201-45d9-beda-7ffb07f8a88a",
    name: "Pride Month",
    description:
      "Join us for pride month. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.",
    background: [
      "rgba(255, 188, 91, .1)",
      "rgba(252, 153, 101, .1)",
      "rgba(255, 116, 57, .1)",
      "rgba(255, 46, 84, .1)",
      "rgba(198, 64, 205, .1)",
      "rgba(165, 36, 179, .1)",
      "rgba(105, 31, 169, .1)",
    ],
    image:
      "https://decentraland.org/blog/images/static/images/pride-4be984a59111e68fb428a3ec060c2f07.jpg",
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

  static async find(_filters: {} = {}) {
    return mock.slice()
  }

  static async getScheduleList(ids: string[]) {
    const list = new Set(ids)
    return mock.filter((schedule) => list.has(schedule.id))
  }
}
