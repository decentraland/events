import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"

import ProfileSettingsModel from "../model"
import {
  ProfileSettingsAttributes,
  updateProfileSettingsSchema,
} from "../types"
import { getProfileSettings } from "./getProfileSettings"

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
    return newProfile
  } else {
    const updatedProfile: ProfileSettingsAttributes = {
      ...profile,
      ...attributes,
    }

    await ProfileSettingsModel.update(updatedProfile, { user })
    return updatedProfile
  }
}
