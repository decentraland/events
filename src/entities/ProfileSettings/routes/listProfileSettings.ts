import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"

import ProfileSettingsModel from "../model"
import { canEditAnyProfile } from "../utils"
import { getMyProfileSettings } from "./getMyProfileSettings"

export async function listProfileSettings(req: WithAuth) {
  const currentUserProfile = await getMyProfileSettings(req)
  if (!isAdmin(req.auth) && !canEditAnyProfile(currentUserProfile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  return ProfileSettingsModel.list()
}
