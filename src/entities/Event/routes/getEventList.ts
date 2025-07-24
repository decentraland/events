import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { bool } from "decentraland-gatsby/dist/entities/Route/param"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import isEthereumAddress from "validator/lib/isEthereumAddress"

import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import {
  canApproveAnyEvent,
  canEditAnyEvent,
} from "../../ProfileSettings/utils"
import EventModel from "../model"
import { getEventListQuery } from "../schemas"
import { EventListOptions, EventListParams, EventListType } from "../types"

const validate = createValidator<EventListParams>(getEventListQuery)
export async function getEventList(req: WithAuth) {
  const profile = await getAuthProfileSettings(req)

  // Handle body format: { placeIds: [...], communityId?: string }
  let placesIds: string[] = []
  let communityId: string | undefined

  if (req.method === "POST" && req.body && typeof req.body === "object") {
    placesIds = req.body.placeIds || []
    communityId = req.body.communityId
  }

  const query = validate({
    ...req.query,
    places_ids: placesIds,
  })
  const options: EventListOptions = {
    user: profile.user,
    allow_pending:
      isAdmin(profile.user) ||
      canEditAnyEvent(profile) ||
      canApproveAnyEvent(profile),
    offset: query.offset ? Math.max(Number(query.offset), 0) : 0,
    limit: query.limit
      ? Math.min(Math.max(Number(req.query["limit"]), 0), 500)
      : 500,
    list: query.list || EventListType.Active,
    order: query.order,
  }

  if (options.limit === 0) {
    return []
  }

  if (query.search) {
    if (!/\w{3}/.test(query.search)) {
      return []
    }

    options.search = query.search
  }

  if (query.schedule) {
    options.schedule = query.schedule
  }

  if (query.position) {
    const [x, y] = query.position.split(",").slice(0, 2).map(Number) as [
      number,
      number
    ]

    if (Number.isFinite(x) && Number.isFinite(y) && isInsideWorldLimits(x, y)) {
      options.x = x
      options.y = y
    } else {
      // out of bound
      return []
    }
  }

  if (!!query.positions && query.positions.length > 0) {
    options.positions = []

    for (const position of query.positions) {
      const [x, y] = position.split(",").slice(0, 2).map(Number) as [
        number,
        number
      ]

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !isInsideWorldLimits(x, y)
      ) {
        return []
      }

      options.positions.push([x, y])
    }
  }

  if (query.estate_id) {
    const estateId = Number(query.estate_id)
    if (estateId !== null && Number.isFinite(estateId)) {
      options.estate_id = String(estateId)
    } else {
      // out of bound
      return []
    }
  }

  if (query.creator) {
    if (isEthereumAddress(query.creator)) {
      options.creator = query.creator.toLowerCase()
    } else {
      // invalid user address
      return []
    }
  }

  if (query.only_attendee) {
    if (!req.auth) {
      throw new RequestError(
        "only_attendee filter requieres autentication",
        RequestError.Unauthorized
      )
    }

    options.only_attendee = bool(query.only_attendee) ?? true
  }

  options.world = bool(query.world) ?? undefined

  if (query.world_names) {
    options.world_names = query.world_names
  }

  // Handle places_ids from query or body
  if (query.places_ids && query.places_ids.length > 0) {
    options.places_ids = query.places_ids
  }

  // Handle community_id from query or body
  if (query.community_id) {
    options.community_id = query.community_id
  } else if (communityId) {
    options.community_id = communityId
  }

  const events = await EventModel.getEvents(options)

  const publicEvents = events.map((event) =>
    EventModel.toPublic(event, profile)
  )

  // Return total count when filtering by places_ids or community_id from body
  if (
    (options.places_ids && options.places_ids.length > 0) ||
    options.community_id
  ) {
    const total = await EventModel.countEventsWithFilter(options)

    return {
      events: publicEvents,
      total,
    }
  }

  return publicEvents
}
