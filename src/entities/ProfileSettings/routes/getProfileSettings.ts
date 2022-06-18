import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"
import isEthereumAddress from "validator/lib/isEthereumAddress"

import ProfileSettingsModel from "../model"
import { canEditAnyProfile } from "../utils"
import { getMyProfileSettings } from "./getMyProfileSettings"
import { ProfileSettingsAttributes } from "../types"

export const getProfileSettings = oncePerRequest(async (req: WithAuth) => {
  const currentUserProfile = await getMyProfileSettings(req)
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
