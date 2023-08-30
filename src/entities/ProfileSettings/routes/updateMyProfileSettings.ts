import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"
// import Time from "decentraland-gatsby/dist/utils/date/Time"
// import { sign } from "decentraland-gatsby/dist/utils/sign"
// import isEmail from "validator/lib/isEmail"
// import isEthereumAddress from "validator/lib/isEthereumAddress"

// import { siteUrl } from "../../Event/utils"
// import { sendEmailVerification } from "../../Notification/utils"
import ProfileSettingsModel from "../model"
import {
  // DATA_PARAM,
  // EmailSubscription,
  ProfileSettingsAttributes,
  // SUBSCRIPTION_PATH,
  updateMyProfileSettingsSchema,
} from "../types"
// import { SIGN_SECRET } from "./subscriptions"

export const validateProfileSettings =
  createValidator<ProfileSettingsAttributes>(
    updateMyProfileSettingsSchema as AjvObjectSchema
  )

export async function updateMyProfileSettings(req: WithAuth) {
  const now = new Date()
  const user = req.auth!
  const profile = await ProfileSettingsModel.findOrGetDefault(user)
  const updateAttributes = validateProfileSettings(req.body)

  let emailVerificationRequired = false
  const newProfile: ProfileSettingsAttributes = {
    ...profile,
    ...updateAttributes,
    email_verified: profile.email_verified,
  }

  if (!newProfile.email) {
    newProfile.notify_by_email = false
    newProfile.email_updated_at = null
    newProfile.email_verified_at = null
  }

  if (profile.email !== newProfile.email) {
    newProfile.notify_by_email = false
    newProfile.email_verified = false
    newProfile.email_updated_at = now
    newProfile.email_verified_at = null
    emailVerificationRequired = true
  }

  if (
    newProfile.email &&
    profile.email === newProfile.email &&
    updateAttributes.email_verified === false
  ) {
    newProfile.email_verified = false
    newProfile.email_verified_at = null
    newProfile.email_updated_at = now
    newProfile.notify_by_email = false
    emailVerificationRequired = true
  }

  const amount = await ProfileSettingsModel.count({ user })
  if (amount === 0) {
    await ProfileSettingsModel.create(newProfile)
  } else {
    await ProfileSettingsModel.update(newProfile, { user })
  }

  if (emailVerificationRequired) {
    // TODO: remove
    //await sendVerification(profile.user, newProfile.email!)
  }

  return newProfile
}
