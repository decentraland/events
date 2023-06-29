import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"

import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import EventModel from "../model"

export async function getAttendingEventList(req: WithAuth) {
  const profile = await getAuthProfileSettings(req)
  const events = await EventModel.getAttending(req.auth!)
  return events.map((event) => EventModel.toPublic(event, profile))
}
