import { EventAttributes } from "../entities/Event/types";
import { useMemo } from "react";

export default function useListEvents(events?: Record<string, EventAttributes>) {
  return useMemo(() => {
    if (!events) {
      return []
    }

    return Object.values(events)
      .filter(event => !event.rejected)
      .sort((a, b) => a.start_at.getTime() - b.start_at.getTime())
  }, [events])
}