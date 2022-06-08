import React, { createContext, useContext, useMemo } from "react"

import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import useFeatureSupported from "decentraland-gatsby/dist/hooks/useFeatureSupported"
import API from "decentraland-gatsby/dist/utils/api/API"
import { toBase64 } from "decentraland-gatsby/dist/utils/string/base64"

import Events from "../api/Events"
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfileSettingsAttributes,
} from "../entities/ProfileSettings/types"
import usePushSubscription from "../hooks/usePushSubscription"
import { SegmentEvent } from "../modules/segment"

const defaultProfileSettings = [
  DEFAULT_PROFILE_SETTINGS,
  {
    error: null as Error | null,
    loading: false as boolean,
    reload: (() => null) as () => void,
    subscriptionSupported: false as boolean,
    subscribed: false as boolean,
    unsubscribe: (() => null) as () => void,
    subscribe: (() => null) as () => void,
    set: (() => null) as (settings: ProfileSettingsAttributes) => void,
    update: (() => null) as (
      settings: Partial<ProfileSettingsAttributes>
    ) => void,
    time: 0 as number,
    version: 0 as number,
  },
] as const

const UserSettingsContext = createContext(defaultProfileSettings)

function useProfileSettings() {
  const [account] = useAuthContext()
  const track = useTrackContext()
  const [pushSubscription, pushSubscriptionState] = usePushSubscription()
  const isNotificationSupported = useFeatureSupported("Notification")
  const isServiceWorkerSupported = useFeatureSupported("ServiceWorker")
  const isPushSupported = useFeatureSupported("PushManager")
  const isPushNotificationSupported =
    isNotificationSupported && isServiceWorkerSupported && isPushSupported

  const [settings, state] = useAsyncMemo(
    async () => {
      if (!account) {
        return DEFAULT_PROFILE_SETTINGS
      }

      return Events.get().getMyProfileSettings()
    },
    [account],
    {
      initialValue: DEFAULT_PROFILE_SETTINGS,
      callWithTruthyDeps: true,
    }
  )

  const [updating, update] = useAsyncTask(
    async (settings: Partial<ProfileSettingsAttributes>) => {
      const newSettings = await Events.get().updateMyProfileSettings(settings)
      track(SegmentEvent.Settings, newSettings)
      state.set(newSettings)
    },
    [state, track]
  )

  const [unsubscribing, unsubscribe] = useAsyncTask(async () => {
    if (!pushSubscription) {
      return
    }

    await pushSubscriptionState.unsubscribe()
    await API.catch(Events.get().removeSubscriptions())
    state.reload()
  }, [state])

  const [subscribing, subscribe] = useAsyncTask(async () => {
    if (
      !Notification ||
      !Notification.permission ||
      Notification.permission === "denied" ||
      !isPushNotificationSupported ||
      pushSubscription
    ) {
      return
    }

    const permission = await API.catch(Notification.requestPermission())
    if (permission !== "granted") {
      return
    }

    const subscription = await pushSubscriptionState.subscribe()
    if (!subscription) {
      return
    }

    const options = {
      endpoint: subscription.endpoint,
      p256dh: toBase64(subscription.getKey("p256dh") as any),
      auth: toBase64(subscription.getKey("auth") as any),
    }

    await API.catch(Events.get().createSubscription(options))
    state.reload()
  }, [state])

  const profileState = useMemo(
    () => ({
      ...state,
      loading: state.loading || updating || subscribing || unsubscribing,
      subscriptionSupported: isPushNotificationSupported,
      subscribed: !!pushSubscription,
      unsubscribe,
      subscribe,
      update,
    }),
    [
      state,
      state.loading || updating || subscribing || unsubscribing,
      isPushNotificationSupported,
      !!pushSubscription,
      unsubscribe,
      subscribe,
      update,
    ]
  )

  return [settings, profileState] as const
}

export default function UserSettingsProvider(
  props: React.PropsWithChildren<{}>
) {
  const settings = useProfileSettings()

  return (
    <UserSettingsContext.Provider value={settings}>
      {props.children}
    </UserSettingsContext.Provider>
  )
}

export function useProfileSettingsContext() {
  return useContext(UserSettingsContext)
}
