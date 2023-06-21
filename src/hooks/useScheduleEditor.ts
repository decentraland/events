import React, { useMemo, useState } from "react"

import { AjvStringSchema } from "decentraland-gatsby/dist/entities/Schema/types"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import omit from "lodash/omit"
import isURL from "validator/lib/isURL"
import isUUID from "validator/lib/isUUID"

import Events, { EditSchedule } from "../api/Events"
import { DEFAULT_EVENT_DURATION } from "../entities/Event/types"
import { createScheduleSchema } from "../entities/Schedule/schema"
import { ScheduleAttributes } from "../entities/Schedule/types"

type ScheduleEditorState = EditSchedule & {
  errors: Record<string, string>
}

function getName(
  schedule: React.ChangeEvent<any>,
  props?: { name: string; value: string; type: string; checked: boolean } | any
): string {
  return (props && props.name) || schedule?.target?.name
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
    return schedule?.target?.value
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
    image: defaultSchedule.image || null,
    theme: defaultSchedule.theme || null,
    background: defaultSchedule.background || ["#f3f2f5"],
    active: defaultSchedule.active ?? true,
    active_since: defaultSchedule.active_since || currentDate.toDate(),
    active_until:
      defaultSchedule.active_until ||
      currentDate.add(DEFAULT_EVENT_DURATION).toDate(),
    event_since: defaultSchedule.event_since || currentDate.toDate(),
    event_until:
      defaultSchedule.event_until ||
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

  const event_since = useMemo(() => {
    console.log("schedule.active_since", schedule.active_since)
    console.log("schedule.active_since", typeof schedule.active_since)
    console.log("schedule.event_since", schedule.event_since)
    console.log("schedule.event_since", typeof schedule.event_since)
    return (
      schedule.event_since && Time.from(schedule.event_since.getTime(), { utc })
    )
  }, [schedule.event_since])

  const event_until = useMemo(
    () =>
      schedule.event_until &&
      Time.from(schedule.event_until.getTime(), { utc }),
    [schedule.event_until]
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

  function getEventSinceDate() {
    return event_since && event_since.format(Time.Formats.InputDate)
  }

  function getEventSinceTime() {
    return event_since && event_since.format(Time.Formats.InputTime)
  }

  function getEventUntilDate() {
    return event_until && event_until.format(Time.Formats.InputDate)
  }

  function getEventUntilTime() {
    return event_until && event_until.format(Time.Formats.InputTime)
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

  function handleChangeEventSinceDate(value?: string) {
    if (!value) {
      return
    }

    const event_since = Time.from(value, {
      utc,
      format: Time.Formats.InputDate,
    }).toDate()

    if (
      event_since.getTime() !== schedule.event_since.getTime() &&
      schedule.event_until.getTime() < event_since.getTime()
    ) {
      setValues({
        event_since,
        event_until: event_since,
      })
    } else if (event_since.getTime() !== schedule.event_since.getTime()) {
      setValues({
        event_since,
      })
    }
  }

  function handleChangeEventSinceTime(value?: string) {
    if (!value) {
      return
    }

    const event_since_date = Time.utc(schedule.event_since).startOf("day")
    const event_since_time = Time.utc(value, Time.Formats.InputTime)
    const event_since = Time.utc(
      event_since_date.getTime() + event_since_time.getTime()
    ).toDate()
    if (
      event_since.getTime() !== schedule.event_since.getTime() &&
      schedule.event_until.getTime() < event_since.getTime()
    ) {
      setValues({
        event_since,
        event_until: event_since,
      })
    } else if (event_since.getTime() !== schedule.event_since.getTime()) {
      setValues({ event_since })
    }
  }

  function handleChangeEventUntilDate(value?: string) {
    if (!value) {
      return
    }

    const event_until = Time.from(value, {
      utc,
      format: Time.Formats.InputDate,
    }).toDate()
    if (
      event_until.getTime() !== schedule.event_until.getTime() &&
      schedule.event_since.getTime() <= event_until.getTime()
    ) {
      setValues({
        event_until,
      })
    }
  }

  function handleChangeEventUntilTime(value?: string) {
    if (!value) {
      return
    }

    const event_until_date = Time.utc(schedule.event_until).startOf("day")
    const event_until_time = Time.utc(value, Time.Formats.InputTime)
    const event_until = Time.utc(
      event_until_date.getTime() + event_until_time.getTime()
    ).toDate()
    if (
      event_until.getTime() !== schedule.event_until.getTime() &&
      schedule.event_since.getTime() < event_until.getTime()
    ) {
      setValues({ event_until })
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
            (createScheduleSchema.properties![name] as AjvStringSchema)
              .maxLength!
          )
        )

      case "image":
      case "theme":
        return setValue(name, value || null)

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

      case "event_since_date":
        return handleChangeEventSinceDate(value)

      case "event_since_time":
        return handleChangeEventSinceTime(value)

      case "event_until_date":
        return handleChangeEventUntilDate(value)

      case "event_until_time":
        return handleChangeEventUntilTime(value)

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
    getEventSinceDate,
    getEventSinceTime,
    getEventUntilDate,
    getEventUntilTime,
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
