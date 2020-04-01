import { EventAttributes } from "../entities/Event/types";
import { useMemo } from "react";

export type EventGroup = [Date, EventAttributes[]]

export default function useListEventsByMonth(events?: EventAttributes[] | null) {
  return useMemo<EventGroup[]>(() => {
    const now = Date.now()
    const group = new Map<string, EventAttributes[]>()

    if (events && events.length) {
      for (const event of events) {
        if (event.start_at.getTime() > now) {
          const groupDate = new Date(event.start_at.getFullYear(), event.start_at.getMonth())
          const groupKey = groupDate.toJSON()

          if (!group.has(groupKey)) {
            group.set(groupKey, [])
          }

          group.get(groupKey)!.push(event)
        }
      }
    }

    const list = [] as EventGroup[]

    for (const [date, events] of group.entries()) {
      list.push([new Date(Date.parse(date)), events])
    }

    return list

  }, [events])
}