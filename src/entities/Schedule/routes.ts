import { Request } from "express"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import ScheduleModel from "./model"

export default routes((router) => {
  router.get("/schedules", handle(getScheduleList))
  router.get("/schedules/:schedule_id", handle(getScheduleById))
})

export async function getScheduleList() {
  return ScheduleModel.getSchedules()
}

export async function getScheduleById(req: Request<{ schedule_id: string }>) {
  const id = req.params.schedule_id
  const schedule = await ScheduleModel.findOne({ id })
  if (!schedule) {
    throw new RequestError(`Schedule "${id}" not found`, RequestError.NotFound)
  }

  return schedule
}
