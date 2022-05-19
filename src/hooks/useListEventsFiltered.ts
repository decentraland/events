import {
  EventTimeParams,
  SessionEventAttributes,
  ToggleItemsValue,
} from "../entities/Event/types"
import { useMemo } from "react"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { ProfileSettingsAttributes } from "../entities/ProfileSettings/types"

export default function useListEventsFiltered(
  events?: SessionEventAttributes[] | null,
  filter?: {
    search?: string | null
    type?: ToggleItemsValue | null
    categories?: string | null
    time?: EventTimeParams
  },
  settings?: ProfileSettingsAttributes | null
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

    if (filter.type && filter.type !== ToggleItemsValue.All) {
      const type = filter.type

      events = events.filter((event) => {
        if (type === ToggleItemsValue.One) {
          return event.duration <= Time.Day
        } else {
          return event.duration > Time.Day || event.recurrent
        }
      })
    }

    if (filter.categories && filter.categories != "all") {
      const matches = filter.categories.toLowerCase()

      events = events.filter((event) => {
        const categoryList = new Set<string>(event.categories)
        return categoryList.has(matches)
      })
    }

    if (filter.time) {
      const fromHour = Time.duration(filter.time.start, "minutes").format("HH")
      const fromMinute = Time.duration(filter.time.start, "minutes").format(
        "mm"
      )
      const toHour = Time.duration(filter.time.end, "minutes").format("HH")
      const toMinute = Time.duration(filter.time.end, "minutes").format("mm")

      events = events.filter((event) => {
        const eventDate = Time.from(event.start_at, {
          utc: !settings?.use_local_time,
        })

        let eventTimeFrom = Time.from(event.start_at, {
          utc: !settings?.use_local_time,
        })
          .set("hour", Number(fromHour))
          .set("minute", Number(fromMinute))
        let eventTimeTo = Time.from(event.start_at, {
          utc: !settings?.use_local_time,
        })
          .set("hour", Number(toHour))
          .set("minute", Number(toMinute))
        if (filter?.time?.start === 1440) {
          eventTimeFrom = eventTimeFrom.add(1, "day")
        }
        if (filter?.time?.end === 1440) {
          eventTimeTo = eventTimeTo.add(1, "day")
        }

        return eventDate.isBetween(eventTimeFrom, eventTimeTo, null, "[]")
      })
    }

    return events
  }, [events, filter])
}
