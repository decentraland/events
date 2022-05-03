import once from "decentraland-gatsby/dist/utils/function/once"
import Events from "../api/Events"
import { EventCategoryAttributes } from "../entities/EventCategory/types"

export const getCategoriesFetch = once(
  async () => await Events.get().getCategories()
)

export type Option = { key: string; value: string; text: string }

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
