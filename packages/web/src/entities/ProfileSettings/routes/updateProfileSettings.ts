import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import {
  ProfileSettingsAttributes,
  updateProfileSettingsSchema,
} from "events-type/src/types/ProfileSettings"
import difference from "lodash/difference"

import { getProfileSettings } from "./getProfileSettings"
import { notifyProfileSettingUpdate } from "../../Slack/utils"
import ProfileSettingsModel from "../model"

export const validateProfileSettings =
  createValidator<ProfileSettingsAttributes>(
    updateProfileSettingsSchema as AjvObjectSchema
  )

export async function updateProfileSettings(req: WithAuth) {
  const user = req.params.profile_id.toLowerCase()
  const profile = await getProfileSettings(req)
  const attributes = validateProfileSettings(req.body)
  if (!profile) {
    const newProfile: ProfileSettingsAttributes = {
      ...ProfileSettingsModel.getDefault(user),
      ...attributes,
    }

    await ProfileSettingsModel.create(newProfile)
    if (newProfile.permissions.length > 0) {
      await notifyProfileSettingUpdate(newProfile)
    }

    return newProfile
  } else {
    const updatedProfile: ProfileSettingsAttributes = {
      ...profile,
      ...attributes,
    }

    await ProfileSettingsModel.update(updatedProfile, { user })
    if (
      profile.permissions.length !== updatedProfile.permissions.length ||
      difference(profile.permissions, updatedProfile.permissions).length > 0
    ) {
      await notifyProfileSettingUpdate(updatedProfile)
    }
    return updatedProfile
  }
}
