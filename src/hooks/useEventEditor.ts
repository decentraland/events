import { useState, useMemo } from "react"
import isURL from "validator/lib/isURL"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import {
  Frequency,
  WeekdayMask,
  MonthMask,
  Position,
  MAX_EVENT_RECURRENT,
  DEFAULT_EVENT_DURATION,
  MAX_EVENT_DURATION,
  MAX_CATAGORIES_ALLOWED,
} from "../entities/Event/types"
import { toWeekdayMask, toRecurrentSetpos } from "../entities/Event/utils"
import { EditEvent } from "../api/Events"
import { newEventSchema } from "../entities/Event/schemas"

type EventEditorState = EditEvent & {
  errors: Record<string, string>
}

function getName(
  event: React.ChangeEvent<any>,
  props?: { name: string; value: string; type: string; checked: boolean } | any
): string {
  return (props && props.name) || event.target.name
}

function getValue(
  event: React.ChangeEvent<any>,
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
    return event.target.value
  }
}

export default function useEventEditor(defaultEvent: Partial<EditEvent> = {}) {
  const utc = true
  const currentDate = useMemo(() => Time.utc().seconds(0).milliseconds(0), [])

  const [event, setEvent] = useState<EventEditorState>({
    name: defaultEvent.name || "",
    description: defaultEvent.description || "",
    contact: defaultEvent.contact || "",
    details: defaultEvent.details || "",
    image: defaultEvent.image || "",
    x: defaultEvent.x || 0,
    y: defaultEvent.x || 0,
    server: defaultEvent.server || null,
    url: defaultEvent.url || "",
    start_at: defaultEvent.start_at || currentDate.toDate(),
    duration: defaultEvent.duration || DEFAULT_EVENT_DURATION,
    all_day: defaultEvent.all_day || false,
    approved: false,
    rejected: false,
    highlighted: false,
    trending: false,
    categories: [],

    // recurrent
    recurrent: false,
    recurrent_interval: 1,
    recurrent_frequency: null,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_until: null,
    recurrent_count: null,

    errors: {},
  })

  // const finish_at = useMemo(() => new Datetime(new Date(event.start_at.getTime() + event.duration), options), [event.start_at.getTime(), event.duration])
  const finish_at = useMemo(
    () => Time.from(event.start_at.getTime() + event.duration, { utc }),
    [event.start_at.getTime(), event.duration]
  )
  const start_at = useMemo(
    () => Time.from(event.start_at.getTime(), { utc }),
    [event.start_at.getTime()]
  )

  function getStartDate() {
    // return start_at.toInputDate()
    return start_at.format(Time.Formats.InputDate)
  }

  function getStartTime() {
    return start_at.format(Time.Formats.InputTime)
    // return start_at.toInputTime()
  }

  function getFinishDate() {
    return finish_at.format(Time.Formats.InputDate)
    // return finish_at.toInputDate()
  }

  function getFinishTime() {
    return finish_at.format(Time.Formats.InputTime)
    // return finish_at.toInputTime()
  }

  /**
   * Return the max duration event in hours like 24Hrs
   * @returns
   */
  function getMaxHoursAllowedLabel(): string {
    return MAX_EVENT_DURATION / Time.Hour + "Hrs"
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

  function setValue<K extends keyof EditEvent>(key: K, value: EditEvent[K]) {
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

  function setValues(event: Partial<EditEvent>) {
    setEvent((current) => {
      const errors = { ...current.errors }

      for (const key of Object.keys(event)) {
        delete errors[key]
      }

      return {
        ...current,
        ...event,
        errors,
      }
    })
  }

  function handleChangeStartDate(value?: string) {
    if (!value) {
      return
    }

    const start_at = Time.from(value, {
      utc,
      format: Time.Formats.InputDate,
    }).toDate()

    if (start_at.getTime() !== event.start_at.getTime()) {
      let recurrent_until = event.recurrent_until
      if (
        recurrent_until !== null &&
        recurrent_until.getTime() < start_at.getTime()
      ) {
        // recurrent_until = Datetime.fromInputTime('00:00', start_at, options).date
        recurrent_until = Time.from(start_at, { utc }).toDate()
      }

      setValues({
        start_at,
        recurrent_until,
        recurrent_monthday: null,
        recurrent_setpos: null,
      })
    }
  }

  function handleChangeStartTime(value?: string) {
    // const start_at = Datetime.fromInputTime(value || '', event.start_at, options).date
    if (!value) {
      return
    }

    const start_date = Time.utc(event.start_at).startOf("day")
    const start_time = Time.utc(value, Time.Formats.InputTime)
    const start_at = Time.utc(
      start_date.getTime() + start_time.getTime()
    ).toDate()
    if (start_at.getTime() !== event.start_at.getTime()) {
      setValues({ start_at })
    }
  }

  function handleChangeFinishDate(value?: string) {
    if (!value) {
      return
    }

    const finish_time = Time.utc(
      finish_at.format("HH:mm"),
      Time.Formats.InputTime
    )
    const finish_date = Time.utc(value, Time.Formats.InputDate)
    const duration = Math.max(
      0,
      finish_date.getTime() + finish_time.getTime() - event.start_at.getTime()
    )
    // Change duration only if it's a different value and if it's less or equals to the max or previous duration or previous allowed
    if (
      duration !== event.duration &&
      duration <= Math.max(event.duration, MAX_EVENT_DURATION)
    ) {
      setValues({ duration })
    }
  }

  function handleChangeFinishTime(value?: string) {
    if (!value) {
      return
    }

    const finish_time = Time.utc(value, Time.Formats.InputTime)
    const finish_date = Time.utc(finish_at).startOf("day")
    const duration = Math.max(
      0,
      finish_date.getTime() + finish_time.getTime() - event.start_at.getTime()
    )
    // Change duration only if it's a different value and if it's less or equals to the max or previous duration allowed
    if (
      duration !== event.duration &&
      duration <= Math.max(event.duration, MAX_EVENT_DURATION)
    ) {
      setValues({ duration })
    }
  }

  function handleChangeAllDay(value?: boolean) {
    if (!value) {
      setValue("all_day", false)
    } else {
      let finish_at_tmp = finish_at.startOf("day")
      const start_at_tmp = start_at.startOf("day")

      while (finish_at_tmp.getTime() <= start_at_tmp.getTime()) {
        finish_at_tmp = finish_at_tmp.add(1, "day")
      }

      setValues({
        start_at: start_at_tmp.toDate(),
        duration: finish_at_tmp.getTime() - start_at_tmp.getTime(),
        all_day: true,
      })
    }
  }

  function handleChangePosition(name: "x" | "y", value?: string) {
    const position = Number(value)
    if (value === "") {
      setValue(name, value as any)
    } else {
      let x = event.x
      let y = event.y

      switch (name) {
        case "x":
          x = position
          break
        case "y":
          y = position
          break
      }

      const xMax = 163
      const xMin = -150
      const yMax = 158
      const yMin = -150

      // NOTE: don't use isInsideWorldLimits
      if (xMax >= x && x >= xMin && yMax >= y && y >= yMin) {
        setValue(name, position)
      }
    }
  }

  function handleChangeRecurrent(value?: any) {
    if (value) {
      setValues({
        recurrent: true,
        recurrent_interval: 1,
        recurrent_frequency: Frequency.DAILY,
        recurrent_month_mask: 0,
        recurrent_weekday_mask: 0,
        recurrent_setpos: null,
        recurrent_monthday: null,
        recurrent_until: start_at.startOf("day").toDate(),
        recurrent_count: null,
        duration: event.duration > Time.Day ? Time.Day : event.duration,
      })
    } else {
      setValues({
        recurrent: false,
        recurrent_interval: 1,
        recurrent_frequency: null,
        recurrent_month_mask: 0,
        recurrent_weekday_mask: 0,
        recurrent_setpos: null,
        recurrent_monthday: null,
        recurrent_until: null,
        recurrent_count: null,
      })
    }
  }

  function handleChangeInterval(value?: string) {
    const interval = Number(value)
    if (value === "") {
      setValue("recurrent_interval", value as any)
    } else if (interval >= 1) {
      setValue("recurrent_interval", interval)
    }
  }

  function handleChangeFrequency(value?: string) {
    switch (value) {
      case Frequency.DAILY:
        return setValues({
          recurrent_frequency: Frequency.DAILY,
          recurrent_weekday_mask: WeekdayMask.NONE,
          recurrent_month_mask: MonthMask.NONE,
          recurrent_monthday: null,
          recurrent_setpos: null,
        })

      case Frequency.WEEKLY:
        return setValues({
          recurrent_frequency: Frequency.WEEKLY,
          recurrent_weekday_mask: toWeekdayMask(event.start_at),
          recurrent_month_mask: WeekdayMask.NONE,
          recurrent_monthday: null,
          recurrent_setpos: null,
        })

      case Frequency.MONTHLY:
        const day = event.start_at.getUTCDate()
        return setValues({
          recurrent_frequency: Frequency.MONTHLY,
          recurrent_weekday_mask: WeekdayMask.NONE,
          recurrent_month_mask: MonthMask.ALL,
          recurrent_monthday: day,
          recurrent_setpos: null,
        })
      default:
      // ignore
    }
  }

  function handleChangeMonthlyDayRepeat() {
    const day = event.start_at.getUTCDate()
    return setValues({
      recurrent_monthday: day,
      recurrent_weekday_mask: WeekdayMask.NONE,
      recurrent_setpos: null,
    })
  }

  function handleChangeMonthlyPositionRepeat() {
    return setValues({
      recurrent_monthday: null,
      recurrent_weekday_mask: toWeekdayMask(event.start_at),
      recurrent_setpos: toRecurrentSetpos(event.start_at),
    })
  }

  function handleChangeMonthlyLastPositionRepeat() {
    return setValues({
      recurrent_monthday: null,
      recurrent_weekday_mask: toWeekdayMask(event.start_at),
      recurrent_setpos: Position.LAST,
    })
  }

  function handleChangeRecurrentEnd(value: "until" | "count") {
    switch (value) {
      case "until":
        return setValues({
          recurrent_until: start_at.startOf("day").toDate(),
          recurrent_count: null,
        })
      case "count":
        return setValues({
          recurrent_until: null,
          recurrent_count: 1,
        })

      default:
      // ignore
    }
  }

  function handleChangeRecurrentCount(value?: string) {
    const recurrent_count = Number(value)
    if (value === "") {
      setValue("recurrent_count", value as any)
    } else if (recurrent_count > 0 && recurrent_count <= MAX_EVENT_RECURRENT) {
      setValue("recurrent_count", recurrent_count)
    }
  }

  function handleChangeRecurrentUntil(value: string) {
    // const recurrent_until = Datetime.fromInputDate(value, event.recurrent_until || event.start_at).date
    const recurrent_until = Time.from(value, {
      utc,
      format: Time.Formats.InputDate,
    }).toDate()
    setValue("recurrent_until", recurrent_until)
  }

  function handleChangeCategories(value: string) {
    let currentCategories = event.categories
    if (currentCategories.includes(value)) {
      currentCategories = currentCategories.filter((e) => e != value)
    } else {
      currentCategories = [...currentCategories, value]
    }
    setValue("categories", currentCategories)
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
      case "details":
      case "contact":
        return setValue(
          name,
          String(value || "").slice(
            0,
            newEventSchema.properties[name].maxLength
          )
        )

      case "image":
      case "url":
      case "server":
        return setValue(name, value)

      case "highlighted":
      case "trending":
      case "rejected":
      case "approved":
        return setValue(name, !!value)

      case "x":
      case "y":
        return handleChangePosition(name, value)

      case "start_date":
        return handleChangeStartDate(value)

      case "start_time":
        return handleChangeStartTime(value)

      case "finish_date":
        return handleChangeFinishDate(value)

      case "finish_time":
        return handleChangeFinishTime(value)

      case "all_day":
        return handleChangeAllDay(value)

      case "recurrent":
        return handleChangeRecurrent(value)

      case "recurrent_interval":
        return handleChangeInterval(value)

      case "recurrent_frequency":
        return handleChangeFrequency(value)

      case "recurrent_weekday_mask[MONDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.MONDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.MONDAY
        )

      case "recurrent_weekday_mask[TUESDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.TUESDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.TUESDAY
        )

      case "recurrent_weekday_mask[WEDNESDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.WEDNESDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.WEDNESDAY
        )

      case "recurrent_weekday_mask[THURSDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.THURSDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.THURSDAY
        )

      case "recurrent_weekday_mask[FRIDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.FRIDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.FRIDAY
        )

      case "recurrent_weekday_mask[SATURDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.SATURDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.SATURDAY
        )

      case "recurrent_weekday_mask[SUNDAY]":
        return setValue(
          "recurrent_weekday_mask",
          value
            ? (event.recurrent_weekday_mask || 0) | WeekdayMask.SUNDAY
            : (event.recurrent_weekday_mask || 0) & ~WeekdayMask.SUNDAY
        )

      case "recurrent_monthday[current]":
        return handleChangeMonthlyDayRepeat()

      case "recurrent_setpos[current]":
        return handleChangeMonthlyPositionRepeat()

      case "recurrent_setpos[last]":
        return handleChangeMonthlyLastPositionRepeat()

      case "recurrent_end":
        return handleChangeRecurrentEnd(value)

      case "recurrent_count":
        return handleChangeRecurrentCount(value)

      case "recurrent_until":
        return handleChangeRecurrentUntil(value)

      case "categories":
        return handleChangeCategories(value)

      default:
      // ignore change
    }
  }

  function validate(options: { new?: boolean }) {
    const errors: Record<string, string> = {}

    if (!event.name) {
      errors["name"] = "Event name is required"
    }

    if (event.url && !isURL(event.url)) {
      errors["url"] = "Event URL is invalid"
    }

    if (event.image && !isURL(event.image)) {
      errors["image"] = "Event image is invalid"
    }

    if ((event.x as any) === "") {
      errors["x"] = "Latitude is required"
    }

    if ((event.y as any) === "") {
      errors["y"] = "Longitude is required"
    }

    if ((event.recurrent_interval as any) === "") {
      errors["recurrent_interval"] = "Interval is invalid"
    }

    if (
      event.recurrent &&
      event.recurrent_until === null &&
      event.recurrent_count === null
    ) {
      errors["recurrent_end"] = "Missing recurrent end"
    } else if ((event.recurrent_count as any) === "") {
      errors["recurrent_count"] = "Invalid count"
    }

    if (event.categories.length > MAX_CATAGORIES_ALLOWED) {
      errors["categories"] = `Maximun tags allowed ${MAX_CATAGORIES_ALLOWED}`
    }

    if (options.new && event.duration > MAX_EVENT_DURATION) {
      errors["finish_date"] =
        "Maximum allowed duration " + getMaxHoursAllowedLabel()
    }

    if (event.duration < 0) {
      errors["finish_date"] = "End date should be after start date"
    }

    if (Object.values(errors).filter(Boolean).length) {
      setErrors({ ...event.errors, ...errors })
      return false
    }

    if (Object.values(event.errors).filter(Boolean).length) {
      return false
    }

    return true
  }

  function toObject() {
    const { errors, ...data } = event
    return data
  }

  const actions = {
    getStartDate,
    getStartTime,
    getFinishDate,
    getFinishTime,
    getMaxHoursAllowedLabel,
    setValue,
    setValues,
    setError,
    setErrors,
    handleChange,
    validate,
    toObject,
  }

  return [event, actions] as const
}
