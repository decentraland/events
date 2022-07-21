import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"

import ProfileSubscriptionModel from "../../ProfileSubscription/model"
import ProfileSettingsModel from "../model"

export const getAuthProfileSettings = oncePerRequest(async (req: WithAuth) => {
  const [settings, subscriptions] = await Promise.all([
    ProfileSettingsModel.findOrGetDefault(req.auth || ""),
    ProfileSubscriptionModel.findByUser(req.auth || ""),
  ] as const)

  return {
    ...settings,
    subscriptions,
  }
})
