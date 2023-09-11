import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import env from "decentraland-gatsby/dist/utils/env"
import { fromWebPushKey } from "decentraland-gatsby/dist/utils/string/base64"

import useServiceWorker from "./useServiceWorker"

export type PushSubscriptionState = {
  pushManager: PushManager | null
  subscription: PushSubscription | null
}

const applicationServerKey = fromWebPushKey(env("WEB_PUSH_KEY", ""))

/** @deprecated Notification no longer used */
export default function usePushSubscription(path = "/sw.js") {
  const registration = useServiceWorker(path)
  const [state, patchState] = usePatchState<PushSubscriptionState>({
    pushManager: null,
    subscription: null,
  })

  useAsyncEffect(async () => {
    if (registration && registration.pushManager) {
      const subscription = await registration.pushManager.getSubscription()

      patchState({
        pushManager: registration.pushManager,
        subscription,
      })
    }
  }, [registration])

  /** @deprecated Notification no longer used */
  async function subscribe() {
    if (state.subscription) {
      return state.subscription
    }

    if (!state.pushManager) {
      return null
    }

    const subscription = await state.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })

    patchState({ subscription })

    return subscription
  }

  /** @deprecated Notification no longer used */
  async function unsubscribe() {
    if (!state.subscription) {
      return false
    }

    if (!state.pushManager) {
      return false
    }

    const result = await state.subscription.unsubscribe()
    if (result) {
      patchState({ subscription: null })
    }

    return result
  }

  return [state.subscription, { subscribe, unsubscribe }] as const
}
