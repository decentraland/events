import { useMemo } from "react"

import { SessionEventAttributes } from "../entities/Event/types"

export default function useListEvents(
  events?: Record<string, SessionEventAttributes>
) {
  return useMemo(() => {
    if (!events) {
      return []
    }

    const now = Date.now()
    return Object.values(events)
      .filter((event) => {
        if (event.rejected) {
          return false
        }

        if (!event.approved && !event.owned && !event.editable) {
          return false
        }

        if (event.finish_at.getTime() < now) {
          return false
        }

        return true
      })
      .sort((a, b) => a.next_start_at.getTime() - b.next_start_at.getTime())
  }, [events])
}
