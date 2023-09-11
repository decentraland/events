import { requiredEnv } from "decentraland-gatsby/dist/utils/env"
import { verify } from "decentraland-gatsby/dist/utils/sign"
import { Request, Response } from "express"

import { siteUrl } from "../../Event/utils"
import EventAttendeeModel from "../../EventAttendee/model"
import ProfileSettingsModel from "../model"
import {
  DATA_PARAM,
  EmailSubscription,
  EmailSubscriptionStatus,
} from "../types"

export const SIGN_SECRET = requiredEnv("SIGN_SECRET")

/** @deprecated Notification no longer used */
export async function verifySubscription(req: Request, res: Response) {
  return checkSubscription(
    req,
    res,
    "verify",
    async (verification: EmailSubscription) => {
      if (verification.action !== "verify") {
        return false
      }

      return ProfileSettingsModel.verify(verification.user, verification.email)
    }
  )
}

/** @deprecated Notification no longer used */
export async function removeSubscription(req: Request, res: Response) {
  return checkSubscription(
    req,
    res,
    "unsubscribe",
    async (verification: EmailSubscription) => {
      if (verification.action !== "unsubscribe") {
        return false
      }

      await EventAttendeeModel.unsubscribe(verification.user)
      return ProfileSettingsModel.unsubscribe(
        verification.user,
        verification.email
      )
    }
  )
}

/** @deprecated Notification no longer used */
export async function checkSubscription(
  req: Request,
  res: Response,
  param: string,
  execute: (subs: EmailSubscription) => Promise<boolean>
) {
  const result = (status: EmailSubscriptionStatus) => {
    const target = siteUrl("/confirm")
    target.searchParams.set(param, String(status))
    res.redirect(302, target.toString())
  }

  if (!req.query[DATA_PARAM]) {
    return result(EmailSubscriptionStatus.Invalid)
  }

  const now = Date.now()
  const verification = verify(
    req.query[DATA_PARAM] as string,
    SIGN_SECRET
  ) as EmailSubscription | null
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
