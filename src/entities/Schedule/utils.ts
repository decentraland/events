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
