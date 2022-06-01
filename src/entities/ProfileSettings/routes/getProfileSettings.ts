import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import ProfileSettingsModel from "../model"
import isEthereumAddress from "validator/lib/isEthereumAddress"
import { canEditAnyProfile } from "../utils"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { getMyProfileSettings } from "./getMyProfileSettings"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"

export const getProfileSettings = oncePerRequest(async (req: WithAuth) => {
  const currentUserProfile = await getMyProfileSettings(req)
  if (!isAdmin(req.auth) && !canEditAnyProfile(currentUserProfile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const user = req.params.profile_id.toLowerCase()
  if (isEthereumAddress(user)) {
    throw new RequestError(`Not found "${user}" profile`, RequestError.NotFound)
  }

  const profile = ProfileSettingsModel.findOne({ user })
  if (!profile) {
    throw new RequestError(`Not found "${user}" profile`, RequestError.NotFound)
  }

  return profile
})
