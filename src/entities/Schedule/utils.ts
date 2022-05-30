import Time from "decentraland-gatsby/dist/utils/date/Time"

import { ScheduleAttributes } from "./types"

export function getMissingSchedules(
  schedules: ScheduleAttributes[],
  ids: string[]
) {
  if (schedules.length === 0 || ids.length === 0) {
    return ids
  }

  const currentSchedules = new Set(schedules.map((schedule) => schedule.id))
  return ids.filter((id) => !currentSchedules.has(id))
}

export function getCurrentSchedules(schedules: ScheduleAttributes[] | null) {
  const now = Date.now()
  return schedules
    ? schedules.find((schedule) =>
        Time.from(now).isBetween(schedule.active_since, schedule.active_until)
      )
    : false
}
