import { Request } from "express"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { ScheduleAttributes } from "./types"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"

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

export default routes((router) => {
  router.get("/schedules", handle(getScheduleList))
  router.get("/schedules/:schedule_id", handle(getScheduleById))
})

export async function getScheduleList() {
  const now = Time.from()
  return mock.filter((schedule) => now.isBefore(schedule.active_until))
}

export async function getScheduleById(req: Request<{ schedule_id: string }>) {
  const id = req.params.schedule_id
  const schedule = mock.find((schedule) => schedule.id === id)
  if (!schedule) {
    throw new RequestError(`Schedule "${id}" not found`, RequestError.NotFound)
  }

  return schedule
}
