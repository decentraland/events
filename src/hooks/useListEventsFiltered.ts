import {
  SessionEventAttributes,
  toggleItemsValue,
} from "../entities/Event/types"
import { useMemo } from "react"
import Time from "decentraland-gatsby/dist/utils/date/Time"

export default function useListEventsFiltered(
  events?: SessionEventAttributes[] | null,
  filter?: {
    search?: string | null
    type?: toggleItemsValue | null
  }
) {
  return useMemo(() => {
    if (!events) {
      return []
    }

    if (!filter) {
      return events
    }

    if (filter.search) {
      const matches = filter.search.toLowerCase().split(/\W+/gi)

      events = events.filter((event) => {
        const name = event.name.toLowerCase()
        const description = event.description.toLowerCase()

        return matches.every((match) => {
          if (!match) {
            return true
          }

          return name.includes(match) || description.includes(match)
        })
      })
    }

    if (filter.type && filter.type !== toggleItemsValue.all) {
      const type = filter.type

      events = events.filter((event) => {
        if (type === toggleItemsValue.one) {
          return event.duration <= Time.Day
        } else {
          return event.duration > Time.Day || event.recurrent
        }
      })
    }

    return events
  }, [events, filter])
}
