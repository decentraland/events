import { SessionEventAttributes } from "../entities/Event/types";
import { useMemo } from "react";

export type EventGroup = [Date, SessionEventAttributes[]]

export default function useListEventsByMonth(events?: SessionEventAttributes[] | null) {
  return useMemo<EventGroup[]>(() => {
    const now = Date.now()
    const group = new Map<string, SessionEventAttributes[]>()

    if (events && events.length) {
      for (const event of events) {
        if (event.finish_at.getTime() > now) {
          const start_at = event.start_at.getTime() < now ? new Date(now) : event.start_at;
          const groupDate = new Date(start_at.getFullYear(), start_at.getMonth())
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