import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"
import isEthereumAddress from "validator/lib/isEthereumAddress"

import { getAuthProfileSettings } from "./getAuthProfileSettings"
import ProfileSettingsModel from "../model"
import { ProfileSettingsAttributes } from "../types"
import { canEditAnyProfile } from "../utils"

export const getProfileSettings = oncePerRequest(async (req: WithAuth) => {
  const currentUserProfile = await getAuthProfileSettings(req)
  if (!isAdmin(req.auth) && !canEditAnyProfile(currentUserProfile)) {
    throw new RequestError(`Forbidden`, RequestError.Forbidden)
  }

  const user = req.params.profile_id.toLowerCase()
  if (!isEthereumAddress(user)) {
    throw new RequestError(
      `Not found "${user}" profile: invalid address`,
      RequestError.NotFound
    )
  }

  return ProfileSettingsModel.findOne<ProfileSettingsAttributes>({ user })
})
