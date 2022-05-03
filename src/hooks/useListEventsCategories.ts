import { useMemo } from "react"
import { SessionEventAttributes } from "../entities/Event/types"
import { EventCategoryAttributes } from "../entities/EventCategory/types"

export default function useListEventsCategories(
  events?: SessionEventAttributes[] | null,
  categories?: EventCategoryAttributes[] | null
) {
  return useMemo(() => {
    if (events && categories) {
      let categoriesFound: string[] = []
      events.map(
        (item) => (categoriesFound = [...categoriesFound, ...item.categories])
      )

      const categoryList = new Set<string>()
      for (let category of categoriesFound) {
        if (!categoryList.has(category)) {
          categoryList.add(category)
        }
      }

      return categories.filter((category) => categoryList.has(category.name))
    } else {
      return []
    }
  }, [events, categories])
}
