import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import { v4 as uuid } from "uuid"

import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import API from "decentraland-gatsby/dist/utils/api/API"
import Land from "decentraland-gatsby/dist/utils/api/Land"
import Time from "decentraland-gatsby/dist/utils/date/Time"

import EventCategoryModel from "../../EventCategory/model"
import { notifyNewEvent } from "../../Slack/utils"
import EventModel from "../model"
import { newEventSchema } from "../schemas"
import {
  DeprecatedEventAttributes,
  EventAttributes,
  MAX_EVENT_DURATION,
} from "../types"
import { calculateRecurrentProperties, eventTargetUrl } from "../utils"

const validateNewEvent = createValidator<EventAttributes>(
  newEventSchema as AjvObjectSchema
)
export async function createEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const userProfile = req.authProfile!
  let data = req.body as EventAttributes

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    const { authorization, ...headers } = req.headers
    throw new RequestError("Empty event data", RequestError.BadRequest, {
      body: data,
      headers,
      user,
    })
  }

  if (!data.image) {
    data.image = null
  }

  if (!data.server) {
    data.server = null
  }

  if (!data.url) {
    data.url = eventTargetUrl(data)
  }

  data = validateNewEvent(data)

  const x = data.x
  const y = data.y
  if (!isInsideWorldLimits(x, y)) {
    throw new RequestError(
      `Event is outside the world limits`,
      RequestError.BadRequest,
      { body: data }
    )
  }

  const recurrent = calculateRecurrentProperties(data)

  if (recurrent.duration > MAX_EVENT_DURATION) {
    throw new RequestError(
      `Maximum allowed duration ${MAX_EVENT_DURATION / Time.Hour}Hrs`,
      RequestError.BadRequest,
      { body: data }
    )
  }

  if (data.categories.length) {
    const validation = await EventCategoryModel.validateCategories(
      data.categories
    )
    if (!validation) {
      throw new RequestError(
        `Invalid category tag supplied`,
        RequestError.BadRequest,
        { body: data }
      )
    }
  }

  const now = new Date()
  const event_id = uuid()
  const tiles = await API.catch(Land.get().getTiles([x, y], [x, y]))
  const tile = tiles && tiles[[x, y].join(",")]
  const estate_id = tile?.estateId || null
  const estate_name = tile?.name || null
  const image =
    data.image ||
    (estate_id
      ? Land.get().getEstateImage(estate_id)
      : Land.get().getParcelImage([x, y]))
  const user_name = userProfile.name || null
  const next_start_at = EventModel.selectNextStartAt(
    recurrent.duration,
    recurrent.start_at,
    recurrent.recurrent_dates
  )
  const next_finish_at = new Date(next_start_at.getTime() + recurrent.duration)

  const event: DeprecatedEventAttributes = {
    ...data,
    ...recurrent,
    id: event_id,
    image,
    user: user.toLowerCase(),
    next_start_at,
    next_finish_at,
    user_name,
    estate_id,
    estate_name,
    coordinates: [x, y],
    scene_name: estate_name,
    approved: false,
    rejected: false,
    highlighted: false,
    trending: false,
    total_attendees: 0,
    latest_attendees: [],
    schedules: [],
    created_at: now,
    textsearch: null,
  }

  event.textsearch = EventModel.textsearch(event)
  await EventModel.create(event)
  await notifyNewEvent(event)

  return EventModel.toPublic(event, user)
}
