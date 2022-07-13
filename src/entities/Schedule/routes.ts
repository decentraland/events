import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import {
  WithAuth,
  auth,
} from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { Request } from "express"
import omit from "lodash/omit"
import { v4 as uuid } from "uuid"

import { getAuthProfileSettings } from "../ProfileSettings/routes/getAuthProfileSettings"
import { canEditAnySchedule } from "../ProfileSettings/utils"
import ScheduleModel from "./model"
import { ScheduleAttributes } from "./types"

export default routes((router) => {
  const withAuth = auth({ optional: false })
  router.get("/schedules", handle(getScheduleList))
  router.get("/schedules/:schedule_id", handle(getScheduleById))
  router.post("/schedules", withAuth, handle(createSchedule))
  router.patch("/schedules/:schedule_id", withAuth, handle(updateSchedule))
  router.delete("/schedules/:schedule_id", withAuth, handle(deleteSchedule))
})

export async function getScheduleList() {
  return await ScheduleModel.getSchedules()
}

export async function getScheduleById(req: Request<{ schedule_id: string }>) {
  const id = req.params.schedule_id
  const schedule = await ScheduleModel.findOne({ id })
  if (!schedule) {
    throw new RequestError(`Schedule "${id}" not found`, RequestError.NotFound)
  }

  return schedule
}

export async function createSchedule(req: WithAuth) {
  const user = req.auth!
  const data = req.body as ScheduleAttributes
  const profile = await getAuthProfileSettings(req)

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new RequestError("Empty schedule data", RequestError.BadRequest, {
      body: data,
      headers: omit(req.headers, ["authorization"]),
      user,
    })
  }

  if (!isAdmin(user) && !canEditAnySchedule(profile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  return await ScheduleModel.create<ScheduleAttributes>({
    id: uuid(),
    name: data.name,
    description: data.description,
    image: data.image,
    background: data.background,
    active_since: data.active_since,
    active_until: data.active_until,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  })
}

export async function updateSchedule(req: WithAuth) {
  const id = req.params.schedule_id
  const data = req.body as ScheduleAttributes
  const user = req.auth!
  const profile = await getAuthProfileSettings(req)

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new RequestError("Empty schedule data", RequestError.BadRequest, {
      body: data,
      headers: omit(req.headers, ["authorization"]),
      user,
    })
  }

  if (!isAdmin(user) && !canEditAnySchedule(profile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const schedule = await ScheduleModel.findOne<ScheduleAttributes>({ id: id })

  if (!schedule) {
    throw new RequestError(`Schedule "${id}" not found`, RequestError.NotFound)
  }
  const updatedData = {
    name: data.name || schedule.name,
    description: data.description || schedule.description,
    image: data.image || schedule.image,
    background: data.background || schedule.background,
    active_since: data.active_since || schedule.active_since,
    active_until: data.active_until || schedule.active_until,
  }
  await ScheduleModel.update(updatedData, { id: id })
  return updatedData
}

export async function deleteSchedule(req: WithAuth) {
  const id = req.params.schedule_id
  const user = req.auth!
  const profile = await getAuthProfileSettings(req)

  if (!isAdmin(user) && !canEditAnySchedule(profile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const schedule = await ScheduleModel.findOne<ScheduleAttributes>({ id: id })

  if (!schedule) {
    throw new RequestError(`Schedule "${id}" not found`, RequestError.NotFound)
  }

  if (!schedule.active) {
    throw new RequestError(
      `Schedule "${id}" already deactivated`,
      RequestError.NotFound
    )
  }
  const updatedData = {
    active: false,
  }
  await ScheduleModel.update(updatedData, { id: id })
  return await ScheduleModel.findOne<ScheduleAttributes>({ id: id })
}
