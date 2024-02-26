import { useMemo } from "react"

import Time from "decentraland-gatsby/dist/utils/date/Time"

import {
  EventTimeReference,
  EventType,
  SessionEventAttributes,
} from "../entities/Event/types"
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfileSettingsAttributes,
} from "../entities/ProfileSettings/types"
import { EventFilters } from "../modules/locations"

export default function useListEventsFiltered(
  events?: SessionEventAttributes[] | null,
  filter?: EventFilters,
  settings: ProfileSettingsAttributes = DEFAULT_PROFILE_SETTINGS
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

    if (filter.type && filter.type !== EventType.All) {
      const type = filter.type

      events = events.filter((event) => {
        if (type === EventType.One) {
          return event.duration <= Time.Day
        } else {
          return event.duration > Time.Day || event.recurrent
        }
      })
    }

    if (
      filter.timeReference &&
      filter.timeReference !== EventTimeReference.ALL
    ) {
      const timeReference = filter.timeReference
      events = events.filter((event) => {
        const eventDate = Time.from(event.next_start_at)
        const eventCompareDate = Time.from()

        if (timeReference === EventTimeReference.TODAY) {
          return eventDate.isToday()
        } else if (timeReference === EventTimeReference.TOMORROW) {
          return eventDate.isTomorrow()
        } else if (timeReference === EventTimeReference.NEXT_WEEK) {
          return eventDate.isSameOrBefore(eventCompareDate.add(1, "week"))
        } else if (timeReference === EventTimeReference.NEXT_MONTH) {
          return eventDate.isSameOrBefore(eventCompareDate.add(1, "month"))
        } else if (timeReference === EventTimeReference.NEXT_90_DAYS) {
          return eventDate.isSameOrBefore(eventCompareDate.add(3, "month"))
        } else if (timeReference === EventTimeReference.NEXT_120_DAYS) {
          return eventDate.isSameOrBefore(eventCompareDate.add(4, "month"))
        }
        return false
      })
    }

    if (filter.category && filter.category != "all") {
      const matches = filter.category.toLowerCase()

      events = events.filter((event) => {
        const categoryList = new Set<string>(event.categories)
        return categoryList.has(matches)
      })
    }

    if (filter.timeFrom && filter.timeTo) {
      const fromHour = Time.duration(filter.timeFrom, "minutes").format("HH")
      const fromMinute = Time.duration(filter.timeFrom, "minutes").format("mm")
      const toHour = Time.duration(filter.timeTo, "minutes").format("HH")
      const toMinute = Time.duration(filter.timeTo, "minutes").format("mm")

      events = events.filter((event) => {
        const eventDate = Time.from(event.start_at, {
          utc: !settings.use_local_time,
        })

        let eventTimeFrom = Time.from(event.start_at, {
          utc: !settings.use_local_time,
        })
          .set("hour", Number(fromHour))
          .set("minute", Number(fromMinute))
        let eventTimeTo = Time.from(event.start_at, {
          utc: !settings.use_local_time,
        })
          .set("hour", Number(toHour))
          .set("minute", Number(toMinute))

        if (filter.timeFrom === 1440) {
          eventTimeFrom = eventTimeFrom.add(1, "day")
        }

        if (filter.timeTo === 1440) {
          eventTimeTo = eventTimeTo.add(1, "day")
        }

        return eventDate.isBetween(eventTimeFrom, eventTimeTo, null, "[]")
      })
    }

    return events
  }, [events, filter])
}
