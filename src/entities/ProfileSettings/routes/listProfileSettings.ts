import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"

import { getAuthProfileSettings } from "./getAuthProfileSettings"
import ProfileSettingsModel from "../model"
import { canEditAnyProfile } from "../utils"

export async function listProfileSettings(req: WithAuth) {
  const currentUserProfile = await getAuthProfileSettings(req)
  if (!isAdmin(req.auth) && !canEditAnyProfile(currentUserProfile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  return ProfileSettingsModel.list()
}
