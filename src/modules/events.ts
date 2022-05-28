import { navigate } from "decentraland-gatsby/dist/plugins/intl/utils"
import once from "decentraland-gatsby/dist/utils/function/once"
import Events from "../api/Events"
import { SessionEventAttributes } from "../entities/Event/types"
import { EventCategoryAttributes } from "../entities/EventCategory/types"
import locations from "./locations"

export type Option = { key: string; value: string; text: string }

// TODO: replace with `loadash.uniqBy `

export const getCategoriesOptionsActives = (
  categories: EventCategoryAttributes[] | null,
  userCategories: string[]
): Option[] => {
  let result: Option[] = []
  if (categories) {
    result = categories
      ?.filter((category) => !userCategories.includes(category.name))
      .map((category) => ({
        key: category.name,
        value: category.name,
        text: `page.events.categories.${category.name}`,
      }))
  }

  return result
}

export const navigateEventDetail = (
  e: React.MouseEvent<any>,
  event: SessionEventAttributes
) => {
  e.stopPropagation()
  e.preventDefault()
  navigate(locations.event(event.id))
}
