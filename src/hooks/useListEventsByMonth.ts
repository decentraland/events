import { SessionEventAttributes } from "../entities/Event/types";
import { useMemo } from "react";

export type EventGroup = [Date, SessionEventAttributes[]]

export default function useListEventsByMonth(events?: SessionEventAttributes[] | null) {
  return useMemo<EventGroup[]>(() => {
    const now = Date.now()
    const group = new Map<string, SessionEventAttributes[]>()

    if (events && events.length) {
      for (const event of events) {
        if (!event.highlighted && event.next_start_at.getTime() + event.duration > now) {
          const next_start_at = event.next_start_at.getTime() < now ? new Date(now) : event.next_start_at;
          const groupDate = new Date(next_start_at.getFullYear(), next_start_at.getMonth())
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
      list.push([new Date(Date.parse(date)), events.sort((a, b) => a.next_start_at.getTime() - b.next_start_at.getTime())])
    }

    return list

  }, [events])
}