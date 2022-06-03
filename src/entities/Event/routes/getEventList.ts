import { isInsideWorldLimits } from "@dcl/schemas/dist/dapps/world"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import Context from "decentraland-gatsby/dist/entities/Route/context"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { bool } from "decentraland-gatsby/dist/entities/Route/param"
import isEthereumAddress from "validator/lib/isEthereumAddress"
import EventModel from "../model"
import { EventListOptions, EventListParams, EventListType } from "../types"
import { getEventListQuery } from "../schemas"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { getMyProfileSettings } from "../../ProfileSettings/routes/getMyProfileSettings"

const validate = createValidator<EventListParams>(getEventListQuery)
export async function getEventList(req: WithAuth) {
  const profile = await getMyProfileSettings(req)
  const query = validate(req.query)
  const options: EventListOptions = {
    user: req.auth,
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

  const events = await EventModel.getEvents(options)
  return events.map((event) => EventModel.toPublic(event, profile))
}
