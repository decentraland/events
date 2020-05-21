import { SessionEventAttributes } from "../entities/Event/types";
import { useMemo } from "react";

export default function useListEvents(events?: Record<string, SessionEventAttributes>) {
  return useMemo(() => {
    if (!events) {
      return []
    }

    return Object.values(events)
      .filter(event => {
        if (event.rejected) {
          return false
        }

        if (!event.approved && !event.owned && !event.editable) {
          return false
        }

        return true
      })
      .sort((a, b) => a.start_at.getTime() - b.start_at.getTime())
  }, [events])
}