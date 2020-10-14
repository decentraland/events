import { utils } from 'decentraland-commons';
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import handle from "decentraland-gatsby/dist/entities/Route/handle";
import { auth, WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware";
import { sign, verify } from "decentraland-gatsby/dist/utils/sign";
import { Response, Request } from "express";
import ProfileSettingsModel from "./model";
import RequestError from "decentraland-gatsby/dist/entities/Route/error";
import { editableAttributes, ProfileSettingsAttributes, EmailSubscriptionStatus, EmailSubscription, DATA_PARAM, SUBSCRIPTION_PATH } from './types';
import isEmail from 'validator/lib/isEmail';
import { sendEmailVerification } from '../Notification/utils';
import { requiredEnv } from 'decentraland-gatsby/dist/utils/env';
import ProfileSubscriptionModel from '../ProfileSubscription/model';
import EventAttendeeModel from '../EventAttendee/model';
import Datetime from 'decentraland-gatsby/dist/utils/Datetime';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

const EVENTS_URL = process.env.GATSBY_EVENTS_URL || process.env.EVENTS_URL || 'https://events.decentraland.org/api'
const SIGN_SECRET = requiredEnv('SIGN_SECRET')

export default routes((router) => {
  const withAuth = auth()
  router.get('/profile/settings', withAuth, handle(getMyProfileSettings))
  router.patch('/profile/settings', withAuth, handle(updateProfileSettings))
})

export async function getProfileSettings(user: string) {
  const settings = await ProfileSettingsModel.findOne<ProfileSettingsAttributes>({ user })

  if (settings) {
    return settings
  }

  let defaultSettings = {
    user,
    email: null,
    email_verified: false,
    email_verified_at: null,
    email_updated_at: null,
    use_local_time: false,
    notify_by_email: false,
    notify_by_browser: false
  }

  await ProfileSettingsModel.create(defaultSettings)
  return defaultSettings
}

export async function getMyProfileSettings(req: WithAuth) {
  const [settings, subscriptions] = await Promise.all([
    getProfileSettings(req.auth!),
    ProfileSubscriptionModel.findByUser(req.auth!)
  ])

  return {
    ...settings,
    subscriptions
  }
}

export async function updateProfileSettings(req: WithAuth) {
  const now = new Date()
  const user = req.auth!
  const profile = await getProfileSettings(user)
  const updateAttributes = utils.pick(req.body || {}, editableAttributes) as ProfileSettingsAttributes

  const errors = ProfileSettingsModel.validate(updateAttributes)
  if (errors) {
    throw new RequestError('Invalid event data', RequestError.BadRequest, { errors, update: updateAttributes, body: req.body })
  }

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
    await sendVerification(profile.user, newProfile.email!)
  }

  return newProfile
}

async function sendVerification(user: string, email: string) {
  if (isEthereumAddress(user) && isEmail(email)) {
    const verificationData: EmailSubscription = {
      action: 'verify',
      user: user,
      email: email,
      exp: Date.now() + 15 * Datetime.Minute
    }
  
    const verificationUrl = new URL(EVENTS_URL)
    verificationUrl.pathname = SUBSCRIPTION_PATH + '/'
    verificationUrl.searchParams.set(DATA_PARAM, sign(verificationData, SIGN_SECRET))
    await sendEmailVerification(email, verificationUrl.toString())
  }
}

/**
 * 
 */
async function checkSubscription(
  req: Request,
  res: Response,
  param: string,
  execute: (subs: EmailSubscription) => Promise<boolean>
) {
  const result = (status: EmailSubscriptionStatus) => {
    const target = new URL(EVENTS_URL)
    target.pathname = '/confirm'
    target.searchParams.set(param, String(status))
    res.redirect(302, target.toString())
  }

  if (!req.query[DATA_PARAM]) {
    return result(EmailSubscriptionStatus.Invalid)
  }

  const now = Date.now()
  const verification = verify(req.query[DATA_PARAM] as string, SIGN_SECRET) as EmailSubscription | null
  if (!verification) {
    return result(EmailSubscriptionStatus.Invalid)
  }

  if (now > verification.exp) {
    return result(EmailSubscriptionStatus.Expired)
  }

  const emailVerified = await execute(verification)
  if (!emailVerified) {
    return result(EmailSubscriptionStatus.Invalid)
  }

  return result(EmailSubscriptionStatus.OK)
}

export async function removeSubscription(req: Request, res: Response) {
  return checkSubscription(req, res, 'unsubscribe', async (verification: EmailSubscription) => {
    if (verification.action !== 'unsubscribe') {
      return false
    }

    await EventAttendeeModel.unsubscribe(verification.user)
    return ProfileSettingsModel.unsubscribe(verification.user, verification.email)
  })
}

export async function verifySubscription(req: Request, res: Response) {
  return checkSubscription(req, res, 'verify', async (verification: EmailSubscription) => {
    if (verification.action !== 'verify') {
      return false
    }

    return ProfileSettingsModel.verify(verification.user, verification.email)
  })
}
