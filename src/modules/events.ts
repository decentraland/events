import { navigate } from "decentraland-gatsby/dist/plugins/intl/utils"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import once from "decentraland-gatsby/dist/utils/function/once"

import Events from "../api/Events"
import { SessionEventAttributes } from "../entities/Event/types"
import { EventCategoryAttributes } from "../entities/EventCategory/types"
import { ScheduleAttributes } from "../entities/Schedule/types"
import locations from "./locations"

export type Option = { key: string; value: string; text: string }

export const getSchedules = once(async () => await Events.get().getSchedules())

// TODO: replace with `loadash.uniqBy `
export type GetCategoriesOptions = Partial<{
  exclude: string[]
}>

export const getCategoriesOptionsActives = (
  categories: EventCategoryAttributes[] | null,
  options: GetCategoriesOptions = {}
): Option[] => {
  if (!categories || categories.length === 0) {
    return []
  }

  const exclude = new Set(options.exclude)
  return categories
    .filter((category) => !exclude.has(category.name))
    .map((category) => ({
      key: category.name,
      value: category.name,
      text: `page.events.categories.${category.name}`,
    }))
}

export type GetSchedulesOptions = Partial<{
  exclude: string[]
}>

export const getSchedulesOptions = (
  schedules: ScheduleAttributes[] | null,
  options: GetSchedulesOptions = {}
): Option[] => {
  if (!schedules || schedules.length === 0) {
    return []
  }

  const now = Date.now()
  const exclude = new Set(options.exclude)
  return schedules
    .filter((schedule) => {
      return (
        Time.from(schedule.active_until).isAfter(now) &&
        !exclude.has(schedule.id)
      )
    })
    .map((schedule) => ({
      key: schedule.id,
      value: schedule.id,
      text: schedule.name,
    }))
}

export const navigateEventDetail = (
  e: React.MouseEvent<any>,
  event: SessionEventAttributes
) => {
  e.stopPropagation()
  e.preventDefault()
  navigate(locations.event(event.id))
}
