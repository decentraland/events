import { SessionEventAttributes } from "../entities/Event/types"
import { useMemo } from "react"

export default function useListEventsFiltered(
  events?: SessionEventAttributes[] | null,
  search?: string | null
) {
  return useMemo(() => {
    if (!events) {
      return []
    }

    if (!search) {
      return events
    }

    const matches = search
      .toLowerCase()
      .split(/\W+/gi)

    return events
      .filter((event) => {
        const name = event.name.toLowerCase()
        const description = event.description.toLowerCase()

        return matches.every(match => {
          if (!match) {
            return true
          }

          return name.includes(match) || description.includes(match)
        })
      })

  }, [events, search])
}
