import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import ProfileSettingsModel from "../model"
import isEthereumAddress from "validator/lib/isEthereumAddress"
import { canEditAnyProfile } from "../utils"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { getMyProfileSettings } from "./getMyProfileSettings"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"

export async function createProfileSettings(req: WithAuth) {
  const currentUserProfile = await getMyProfileSettings(req)
  if (!isAdmin(req.auth) && !canEditAnyProfile(currentUserProfile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const user = req.params.profile_id.toLowerCase()
  if (isEthereumAddress(user)) {
    throw new RequestError(`Invalid user "${user}"`, RequestError.BadRequest)
  }

  const newProfile = ProfileSettingsModel.getDefault(user)
  await ProfileSettingsModel.create(newProfile)
  return newProfile
}
