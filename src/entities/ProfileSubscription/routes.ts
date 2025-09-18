import {
  WithAuth,
  auth,
} from "decentraland-gatsby/dist/entities/Auth/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"

import ProfileSubscriptionModel from "./model"
import {
  ProfileSubscriptionAttributes,
  profileSubscriptionSchema,
} from "./types"
import ProfileSettingsModel from "../ProfileSettings/model"
import { ProfileSettingsAttributes } from "../ProfileSettings/types"

export default routes((router) => {
  const withAuth = auth()
  router.get(
    "/profiles/subscriptions",
    withAuth,
    handle(getProfileSubscription)
  )
  router.post(
    "/profiles/subscriptions",
    withAuth,
    handle(createProfileSubscription)
  )
  router.delete(
    "/profiles/subscriptions",
    withAuth,
    handle(removeProfileSubscription)
  )
})

/** @deprecated Notification no longer used */
export async function getProfileSubscription(req: WithAuth) {
  const user = req.auth!
  return ProfileSubscriptionModel.find({ user })
}

const validateProfileSubscription =
  createValidator<ProfileSubscriptionAttributes>(profileSubscriptionSchema)
/** @deprecated Notification no longer used */
export async function createProfileSubscription(req: WithAuth) {
  const user = req.auth!
  const data = validateProfileSubscription(req.body)

  const subscription: ProfileSubscriptionAttributes = {
    user,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
  }

  await ProfileSubscriptionModel.create(subscription)
  await ProfileSettingsModel.update<ProfileSettingsAttributes>(
    { notify_by_browser: true },
    { user }
  )
  return true
}

/** @deprecated Notification no longer used */
export async function removeProfileSubscription(req: WithAuth) {
  const user = req.auth!
  await ProfileSubscriptionModel.delete({ user })
  await ProfileSettingsModel.update<ProfileSettingsAttributes>(
    { notify_by_browser: false },
    { user }
  )
  return true
}
