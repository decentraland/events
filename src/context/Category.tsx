import React, { createContext, useContext } from "react"

import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"

import Events from "../api/Events"
import { EventCategoryAttributesWithI18N } from "../entities/EventCategory/types"

const defaultProfileSettings = [
  [] as EventCategoryAttributesWithI18N[],
] as const

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
    { initialValue: [] as EventCategoryAttributesWithI18N[] }
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
