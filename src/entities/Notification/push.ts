import { PushSubscription, RequestOptions, sendNotification } from "web-push"

import env from "decentraland-gatsby/dist/utils/env"

import { ProfileSubscriptionAttributes } from "../ProfileSubscription/types"

const privateKey = env("WEB_PUSH_SECRET", "")
const publicKey = env("WEB_PUSH_KEY", "")

export default async function push(
  subscription: ProfileSubscriptionAttributes,
  data: NotificationOptions & { title?: string; href?: string }
) {
  const auth: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  const options: RequestOptions = {
    vapidDetails: {
      subject: `mailto:${subscription.user}@dcl.gg`,
      publicKey,
      privateKey,
    },
  }

  return sendNotification(auth, JSON.stringify(data), options)
}
