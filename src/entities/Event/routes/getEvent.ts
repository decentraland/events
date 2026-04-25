import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import isUUID from "validator/lib/isUUID"

import EventAttendee from "../../EventAttendee/model"
import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import { ProfileSettingsAttributes } from "../../ProfileSettings/types"
import {
  canApproveAnyEvent,
  canEditAnyEvent,
} from "../../ProfileSettings/utils"
import EventModel from "../model"
import { getEventParamsSchema } from "../schemas"
import { EventAttributes, GetEventParams } from "../types"

export const validateGetEventParams =
  createValidator<GetEventParams>(getEventParamsSchema)

export type GetEventOptions = {
  includePending?: boolean
  includeRejected?: boolean
  profile?: ProfileSettingsAttributes
  profileForEvent?: (event: EventAttributes) => ProfileSettingsAttributes
}

export async function getEventWithOptions(
  req: WithAuth,
  options: GetEventOptions = {}
) {
  const user = req.auth
  let profile = options.profile
  const params = validateGetEventParams(req.params)

  if (!isUUID(params.event_id)) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  const event = EventModel.build(
    await EventModel.findOne<EventAttributes>({ id: params.event_id })
  )

  if (!event) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  if (options.profileForEvent) {
    profile = options.profileForEvent(event)
  } else if (!profile) {
    profile = await getAuthProfileSettings(req)
  }

  if ((!event.approved && !options.includePending) || event.rejected) {
    if (event.rejected && options.includeRejected) {
      return EventModel.toPublic(event, profile)
    }

    if (!user) {
      throw new RequestError(
        `Not found event "${params.event_id}"`,
        RequestError.NotFound
      )
    }

    if (!canReadEvent(event, profile)) {
      throw new RequestError(
        `Not found event "${params.event_id}"`,
        RequestError.NotFound
      )
    }
  }

  let attending = false
  if (user) {
    const count = await EventAttendee.count({
      user,
      event_id: params.event_id,
    })

    attending = !!count
  }

  return { ...EventModel.toPublic(event, profile), attending }
}

export const getEvent = oncePerRequest(async (req: WithAuth) => {
  return getEventWithOptions(req)
})

function canReadEvent(
  event: EventAttributes,
  profile: ProfileSettingsAttributes
) {
  return (
    isAdmin(profile.user) ||
    event.user === profile.user ||
    canApproveAnyEvent(profile) ||
    canEditAnyEvent(profile)
  )
}
