import { randomUUID } from "crypto"

import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import {
  WithAuth,
  auth,
} from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { Request } from "express"
import pick from "lodash/pick"

import { getAuthProfileSettings } from "../ProfileSettings/routes/getAuthProfileSettings"
import { canEditAnySchedule } from "../ProfileSettings/utils"
import ScheduleModel from "./model"
import { createScheduleSchema, updateScheduleSchema } from "./schema"
import { NewScheduleAttributes, ScheduleAttributes } from "./types"

const createScheduleValidator =
  createValidator<NewScheduleAttributes>(createScheduleSchema)
const updateScheduleValidator =
  createValidator<NewScheduleAttributes>(updateScheduleSchema)

export default routes((router) => {
  const withAuth = auth({ optional: false })
  router.get("/schedules", handle(getScheduleList))
  router.get("/schedules/:schedule_id", handle(getScheduleById))
  router.post("/schedules", withAuth, handle(createSchedule))
  router.patch("/schedules/:schedule_id", withAuth, handle(updateSchedule))
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
  // TODO: validate input data
  const data = createScheduleValidator(req.body || {})
  const profile = await getAuthProfileSettings(req)

  if (!isAdmin(user) && !canEditAnySchedule(profile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  return await ScheduleModel.create<ScheduleAttributes>({
    id: randomUUID(),
    name: data.name,
    description: data.description || null,
    image: data.image || null,
    theme: null,
    background: data.background || [],
    active_since: data.active_since,
    active_until: data.active_until,
    active: data.active ?? true,
    created_at: new Date(),
    updated_at: new Date(),
  })
}

export async function updateSchedule(req: WithAuth) {
  const id = req.params.schedule_id
  // TODO: validate input data
  const data = updateScheduleValidator(req.body || {})
  const user = req.auth!
  const profile = await getAuthProfileSettings(req)

  if (!isAdmin(user) && !canEditAnySchedule(profile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const schedule = await ScheduleModel.findOne<ScheduleAttributes>({ id: id })

  if (!schedule) {
    throw new RequestError(`Schedule "${id}" not found`, RequestError.NotFound)
  }

  const updatedData = Object.assign(
    pick(schedule, Object.keys(updateScheduleSchema.properties as {})),
    pick(data, Object.keys(updateScheduleSchema.properties as {}))
  )

  await ScheduleModel.update(updatedData, { id: id })
  return updatedData
}
