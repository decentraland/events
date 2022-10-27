import React, { useMemo, useState } from "react"

import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import omit from "lodash/omit"
import isURL from "validator/lib/isURL"
import isUUID from "validator/lib/isUUID"

import Events, { EditSchedule } from "../api/Events"
import { DEFAULT_EVENT_DURATION } from "../entities/Event/types"
import { newScheduleSchema } from "../entities/Schedule/schema"
import { ScheduleAttributes } from "../entities/Schedule/types"

type ScheduleEditorState = EditSchedule & {
  errors: Record<string, string>
}

function getName(
  schedule: React.ChangeEvent<any>,
  props?: { name: string; value: string; type: string; checked: boolean } | any
): string {
  return (props && props.name) || schedule.target.name
}

function getValue(
  schedule: React.ChangeEvent<any>,
  props?: { name: string; value: string; type: string; checked: boolean } | any
) {
  if (props) {
    switch (props.type) {
      case "radio":
        return props.checked

      default:
        return props.value || ""
    }
  } else {
    return schedule.target.value
  }
}

export default function useScheduleEditor(
  defaultSchedule: Partial<ScheduleAttributes> = {}
) {
  const l = useFormatMessage()

  const utc = true
  const currentDate = useMemo(() => Time.utc().seconds(0).milliseconds(0), [])

  const [schedule, setEvent] = useState<ScheduleEditorState>({
    name: defaultSchedule.name || "",
    description: defaultSchedule.description || "",
    image: defaultSchedule.image || "",
    background: defaultSchedule.background || ["#f3f2f5"],
    active: defaultSchedule.active ?? true,
    active_since: defaultSchedule.active_since || currentDate.toDate(),
    active_until:
      defaultSchedule.active_until ||
      currentDate.add(DEFAULT_EVENT_DURATION).toDate(),
    errors: {},
  })

  const active_since = useMemo(
    () =>
      schedule.active_since &&
      Time.from(schedule.active_since.getTime(), { utc }),
    [schedule.active_since]
  )

  const active_until = useMemo(
    () =>
      schedule.active_until &&
      Time.from(schedule.active_until.getTime(), { utc }),
    [schedule.active_until]
  )

  function getActiveSinceDate() {
    return active_since && active_since.format(Time.Formats.InputDate)
  }

  function getActiveSinceTime() {
    return active_since && active_since.format(Time.Formats.InputTime)
  }

  function getActiveUntilDate() {
    return active_until && active_until.format(Time.Formats.InputDate)
  }

  function getActiveUntilTime() {
    return active_until && active_until.format(Time.Formats.InputTime)
  }

  function setError(key: string, description: string) {
    setEvent((current) => {
      return {
        ...current,
        errors: {
          ...current.errors,
          [key]: description,
        },
      }
    })
  }

  function setErrors(errors: Record<string, string>) {
    setEvent((current) => {
      return {
        ...current,
        errors: errors,
      }
    })
  }

  function setValue<K extends keyof EditSchedule>(
    key: K,
    value: EditSchedule[K]
  ) {
    setEvent((current) => {
      const errors = { ...current.errors }
      delete errors[key]

      return {
        ...current,
        [key]: value,
        errors,
      }
    })
  }

  function setValues(schedule: Partial<EditSchedule>) {
    setEvent((current) => {
      const errors = omit(current.errors, Object.keys(schedule))

      return {
        ...current,
        ...schedule,
        errors,
      }
    })
  }

  function handleChangeActiveSinceDate(value?: string) {
    if (!value) {
      return
    }

    const active_since = Time.from(value, {
      utc,
      format: Time.Formats.InputDate,
    }).toDate()

    if (
      active_since.getTime() !== schedule.active_since.getTime() &&
      schedule.active_until.getTime() < active_since.getTime()
    ) {
      setValues({
        active_since,
        active_until: active_since,
      })
    } else if (active_since.getTime() !== schedule.active_since.getTime()) {
      setValues({
        active_since,
      })
    }
  }

  function handleChangeActiveSinceTime(value?: string) {
    if (!value) {
      return
    }

    const active_since_date = Time.utc(schedule.active_since).startOf("day")
    const active_since_time = Time.utc(value, Time.Formats.InputTime)
    const active_since = Time.utc(
      active_since_date.getTime() + active_since_time.getTime()
    ).toDate()
    if (
      active_since.getTime() !== schedule.active_since.getTime() &&
      schedule.active_until.getTime() < active_since.getTime()
    ) {
      setValues({
        active_since,
        active_until: active_since,
      })
    } else if (active_since.getTime() !== schedule.active_since.getTime()) {
      setValues({ active_since })
    }
  }

  function handleChangeActiveUntilDate(value?: string) {
    if (!value) {
      return
    }

    const active_until = Time.from(value, {
      utc,
      format: Time.Formats.InputDate,
    }).toDate()
    if (
      active_until.getTime() !== schedule.active_until.getTime() &&
      schedule.active_since.getTime() <= active_until.getTime()
    ) {
      setValues({
        active_until,
      })
    }
  }

  function handleChangeActiveUntilTime(value?: string) {
    if (!value) {
      return
    }

    const active_until_date = Time.utc(schedule.active_until).startOf("day")
    const active_until_time = Time.utc(value, Time.Formats.InputTime)
    const active_until = Time.utc(
      active_until_date.getTime() + active_until_time.getTime()
    ).toDate()
    if (
      active_until.getTime() !== schedule.active_until.getTime() &&
      schedule.active_since.getTime() < active_until.getTime()
    ) {
      setValues({ active_until })
    }
  }

  function handleAddBackground(props: { color: string; position?: number }) {
    const { color, position } = props
    const colors = schedule.background
    if (typeof position !== "undefined") {
      colors.splice(position, 1, color)
      setValues({
        background: [...colors],
      })
    } else {
      setValues({
        background: [...colors, color],
      })
    }
  }

  function handleRemoveBackground(value: number) {
    const colors = schedule.background
    colors.splice(value, 1)
    setValues({
      background: [...colors],
    })
  }

  function handleChange(
    e: React.ChangeEvent<any>,
    props?:
      | { name: string; value: string; type: string; checked: boolean }
      | any
  ) {
    const name = getName(e, props)
    const value = getValue(e, props)

    switch (name) {
      case "name":
      case "description":
        return setValue(
          name,
          String(value || "").slice(
            0,
            newScheduleSchema.properties[name].maxLength
          )
        )

      case "image":
        return setValue(name, value)

      case "active":
        return setValue(name, !!value)

      case "active_since_date":
        return handleChangeActiveSinceDate(value)

      case "active_since_time":
        return handleChangeActiveSinceTime(value)

      case "active_until_date":
        return handleChangeActiveUntilDate(value)

      case "active_until_time":
        return handleChangeActiveUntilTime(value)

      case "background":
        return handleAddBackground(value)

      case "background_remove":
        return handleRemoveBackground(value)

      default:
      // ignore change
    }
  }

  function validate() {
    const errors: Record<string, string> = {}

    if (!schedule.name) {
      errors["name"] = l("validation.module_field_required", {
        module: "Schedule",
        field: "name",
      })
    }

    if (!schedule.description) {
      errors["description"] = l("validation.module_field_required", {
        module: "Schedule",
        field: "description",
      })
    }

    if (schedule.image && !isURL(schedule.image)) {
      errors["image"] = l("validation.module_field_required", {
        module: "Schedule",
        field: "image",
      })
    }

    if (Object.values(errors).filter(Boolean).length) {
      setErrors({ ...schedule.errors, ...errors })
      return false
    }

    if (Object.values(schedule.errors).filter(Boolean).length) {
      return false
    }

    return true
  }

  function toObject() {
    return omit(schedule, ["errors"])
  }

  const actions = {
    getActiveSinceDate,
    getActiveSinceTime,
    getActiveUntilDate,
    getActiveUntilTime,
    setValue,
    setValues,
    setError,
    setErrors,
    handleChange,
    validate,
    toObject,
  }

  return [schedule, actions] as const
}

export function useScheduleEditorId(scheduleId: string | null) {
  return useAsyncMemo(async () => {
    if (!scheduleId || !isUUID(scheduleId)) {
      return null
    }

    const currentSchedule = await Events.get().getSchedule(scheduleId)

    return currentSchedule
  }, [scheduleId])
}
