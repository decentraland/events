import React, { createContext, useContext } from "react"

import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import Events from "events-api/src/Events"
import { EventCategoryAttributes } from "events-type/src/types/EventCategory"

const defaultProfileSettings = [[] as EventCategoryAttributes[]] as const

export function useCategories() {
  const [account, accountState] = useAuthContext()
  const [categories] = useAsyncMemo(
    async () => {
      if (accountState.loading) {
        return []
      }

      return Events.get().getCategories()
    },
    [account, accountState.loading],
    { initialValue: [] as EventCategoryAttributes[] }
  )

  return [categories] as const
}

const CategoriesContext = createContext(defaultProfileSettings)

export default function CategoriesProvider(props: React.PropsWithChildren<{}>) {
  const categories = useCategories()
  return (
    <CategoriesContext.Provider value={categories}>
      {props.children}
    </CategoriesContext.Provider>
  )
}

export function useCategoriesContext() {
  return useContext(CategoriesContext)
}
