import { randomUUID } from "crypto"

import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import API from "decentraland-gatsby/dist/utils/api/API"
import Land from "decentraland-gatsby/dist/utils/api/Land"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"
import omit from "lodash/omit"

import Communities from "../../../api/Communities"
import Places from "../../../api/Places"
import EventCategoryModel from "../../EventCategory/model"
import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import { notifyNewEvent } from "../../Slack/utils"
import EventModel from "../model"
import { newEventSchema } from "../schemas"
import {
  DeprecatedEventAttributes,
  EventAttributes,
  MAX_EVENT_DURATION,
} from "../types"
import {
  calculateRecurrentProperties,
  eventTargetUrl,
  validateImageUrl,
} from "../utils"

const validateNewEvent = createValidator<EventAttributes>(
  newEventSchema as AjvObjectSchema
)

const EVENTS_BASE_URL = env(
  "EVENTS_BASE_URL",
  "https://events.decentraland.org"
)

// TODO: associate event to a place id
export async function createEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!
  const userProfile = req.authProfile!
  const profile = await getAuthProfileSettings(req)
  const data = req.body as EventAttributes

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new RequestError("Empty event data", RequestError.BadRequest, {
      body: data,
      headers: omit(req.headers, ["authorization"]),
      user,
    })
  }

  if (!data.image) {
    data.image = null
  }

  if (!data.image_vertical) {
    data.image_vertical = null
  }

  if (!data.server) {
    data.server = null
  }

  if (!data.url) {
    data.url = eventTargetUrl(data)
  }

  validateNewEvent(data)

  if (data.image) {
    await validateImageUrl(data.image)
  }

  if (data.image_vertical) {
    await validateImageUrl(data.image_vertical)
  }

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

  // Verify community ownership if community_id is provided
  if (data.community_id) {
    try {
      const userCommunities = await Communities.get().getCommunitiesWithToken(
        user
      )
      const community = userCommunities.find((c) => c.id === data.community_id)

      if (!community) {
        throw new RequestError(
          `Community "${data.community_id}" not found or you don't have access to it`,
          RequestError.BadRequest,
          { body: data }
        )
      }
    } catch (error) {
      throw new RequestError(
        `Failed to validate community ownership: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        RequestError.BadRequest,
        { body: data }
      )
    }
  }

  const now = new Date()
  const event_id = randomUUID()
  let estate_name: string | null = null
  let image = ""
  let estate_id = null
  let place_id = null
  if (!data.world) {
    const tiles = await API.catch(Land.getInstance().getTiles([x, y], [x, y]))
    const place = await Places.get().getPlaceByPosition(`${x},${y}`)
    const tile = tiles && tiles[[x, y].join(",")]
    estate_id = tile?.estateId || null
    estate_name = tile?.name || null
    image =
      data.image ||
      (estate_id
        ? Land.getInstance().getEstateImage(estate_id)
        : Land.getInstance().getParcelImage([x, y]))
    place_id = place?.id || null
  } else {
    const world = await Places.get().getWorldByName(data.server!)
    image = data.image || `${EVENTS_BASE_URL}/images/event-default.jpg`
    place_id = world?.id || null
  }

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
    place_id,
  }

  event.textsearch = EventModel.textsearch(event)
  await EventModel.create(event)
  await notifyNewEvent(event)

  return EventModel.toPublic(event, profile)
}
