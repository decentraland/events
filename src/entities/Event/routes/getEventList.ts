import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import Context from "decentraland-gatsby/dist/entities/Route/context"
import { bool, integer } from "decentraland-gatsby/dist/entities/Route/param"
import isEthereumAddress from "validator/lib/isEthereumAddress"
import EventModel from "../model"
import { EventListOptions } from "../types"

export async function getEventList(req: WithAuth, res: Response, ctx: Context) {
  const options: Partial<EventListOptions> = {
    currentUser: req.auth,
    offset: integer(req.query['offset']) ?? 0,
    limit: integer(req.query['limit']) ?? 500,
  }

  if (req.query['position']) {
    const [x, y] = String(req.query['position']).split(',').slice(0, 2).map(integer)
    if (
      x !== null && y !== null &&
      x >= -150 && x <= 150 &&
      y >= -150 && y <= 150
    ) {
      options.x = x
      options.y = y
    } else {

      // out of bound
      return []
    }
  }

  if (req.query['estate_id']) {
    const estateId = integer(req.query['estate_id'])
    if (estateId !== null && Number.isFinite(estateId)) {
      options.estateId = String(estateId)
    } else {

      // out of bound
      return []
    }
  }

  if (req.query['user']) {
    const user = String(req.query['user'])
    if (isEthereumAddress(user)) {
      options.user = user.toLowerCase()
    } else {

      // invalid user address
      return []
    }
  }

  if (req.query['start_in']) {
    const startIn = integer(req.query['start_in'])
    if (startIn !== null && Number.isFinite(startIn) && startIn > 0) {
      options.startIn = startIn * 100
    } else {

      // out of bound
      return []
    }
  }

  if (
    ctx.param('onlyAttendee', { defaultValue: false, parser: bool }) ||  // @deprecated
    ctx.param('only_attendee', { defaultValue: false, parser: bool })
    ) {
    if (req.auth) {
      options.onlyAttendee = true
    } else {

      // attendee without user
      return []
    }
  }

  if (
    ctx.param('onlyUpcoming', { defaultValue: false, parser: bool }) || // @deprecated
    ctx.param('only_upcoming', { defaultValue: false, parser: bool })
  ) {
    options.onlyUpcoming = true
  }

  const events = await EventModel.getEvents(options)
  return events.map((event) => EventModel.toPublic(event, req.auth))
}