import { useMemo } from "react"

import { useProfileSettingsContext } from "../context/ProfileSetting"
import { SessionEventAttributes } from "../entities/Event/types"

export type EventGroup = [Date, SessionEventAttributes[]]

export default function useListEventsByMonth(
  events?: SessionEventAttributes[] | null
) {
  const [settings] = useProfileSettingsContext()
  return useMemo<EventGroup[]>(() => {
    const now = Date.now()
    const utc = !settings?.use_local_time
    const group = new Map<string, SessionEventAttributes[]>()

    if (events && events.length) {
      for (const event of events) {
        if (event.next_start_at.getTime() + event.duration > now) {
          const next_start_at =
            event.next_start_at.getTime() < now
              ? new Date(now)
              : event.next_start_at
          const year =
            (utc && next_start_at.getUTCFullYear()) ||
            next_start_at.getFullYear()
          const month =
            (utc && next_start_at.getUTCMonth()) || next_start_at.getMonth()
          const groupDate = new Date(year, month)
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
      list.push([
        new Date(Date.parse(date)),
        events.sort(
          (a, b) => a.next_start_at.getTime() - b.next_start_at.getTime()
        ),
      ])
    }

    return list
  }, [events, settings])
}
