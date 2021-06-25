import React, { createContext, useContext } from 'react'
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'
import useAsyncMemo, { AsyncMemoResult } from 'decentraland-gatsby/dist/hooks/useAsyncMemo'
import { ProfileSettingsAttributes } from '../entities/ProfileSettings/types'
import Events from '../api/Events'
import useAsyncTask from 'decentraland-gatsby/dist/hooks/useAsyncTask'

const defaultProfileSettings = [
  null as ProfileSettingsAttributes | null,
  {
    error: null as Error | null,
    loading: false as boolean,
    reload: (() => null) as () => void,
    set: (() => null) as (settings: ProfileSettingsAttributes) => void,
    update: (() => null) as (settings: Partial<ProfileSettingsAttributes>) => void,
    time: 0 as number,
    version: 0 as number,
  }
] as const

const UserSettingsContext = createContext(defaultProfileSettings)

function useProfileSettings() {
  const [ account ] = useAuthContext()
  const [ settings, state ] = useAsyncMemo(async () => {
    if (!account) {
      return null
    }

    return Events.get().getMyProfileSettings()
  }, [ account ])

  const [ updating, update ] = useAsyncTask(async (settings: Partial<ProfileSettingsAttributes>) => {
    const newSettings = await Events.get().updateProfileSettings(settings)
    state.set(newSettings)
  })

  return [
    settings,
    {
      ...state,
      loading: state.loading || updating,
      update
    }
  ] as const
}

export default function UserSettingsProvider(props: React.PropsWithChildren<{}>) {
  const settings = useProfileSettings()

  return <UserSettingsContext.Provider value={settings}>
    {props.children}
  </UserSettingsContext.Provider>
}

export function useProfileSettingsContext() {
  return useContext(UserSettingsContext)
}
