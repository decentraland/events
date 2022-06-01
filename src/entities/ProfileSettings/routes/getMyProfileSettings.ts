import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import ProfileSettingsModel from "../model"
import ProfileSubscriptionModel from "../../ProfileSubscription/model"

export const getMyProfileSettings = oncePerRequest(async (req: WithAuth) => {
  const [settings, subscriptions] = await Promise.all([
    ProfileSettingsModel.findOrGetDefault(req.auth!),
    ProfileSubscriptionModel.findByUser(req.auth!),
  ] as const)

  return {
    ...settings,
    subscriptions,
  }
})
