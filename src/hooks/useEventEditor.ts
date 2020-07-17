import { useState, useMemo } from "react";
import isURL from "validator/lib/isURL";
import Datetime from "decentraland-gatsby/dist/utils/Datetime";
import { eventSchema, Frequency, WeekdayMask, MonthMask, Position, MAX_EVENT_RECURRENT } from "../entities/Event/types";
import { toWeekdayMask, toRecurrentSetpos } from "../entities/Event/utils";
import { EditEvent } from "../api/Events";

const DEFAULT_EVENT_DURATION = 1000 * 60 * 60

type EventEditorState = EditEvent & {
  errors: Record<string, string>
}

function getName(event: React.ChangeEvent<any>, props?: { name: string, value: string, type: string, checked: boolean } | any): string {
  return props && props.name || event.target.name
}

function getValue(event: React.ChangeEvent<any>, props?: { name: string, value: string, type: string, checked: boolean } | any) {
  if (props) {
    switch (props.type) {
      case 'radio':
        return props.checked

      default:
        return props.value || ''
    }

  } else {
    return event.target.value
  }
}

export default function useEventEditor(defaultEvent: Partial<EditEvent> = {}) {

  const options = { utc: true }
  const currentDate = useMemo(() => {
    const datetime = Datetime.Now(options)
    datetime.setSeconds(0, 0)
    return datetime
  }, [])

  const [event, setEvent] = useState<EventEditorState>({
    name: defaultEvent.name || '',
    description: defaultEvent.description || '',
    contact: defaultEvent.contact || '',
    details: defaultEvent.details || '',
    image: defaultEvent.image || '',
    x: defaultEvent.x || 0,
    y: defaultEvent.x || 0,
    realm: defaultEvent.realm || null,
    url: defaultEvent.url || '',
    start_at: defaultEvent.start_at || currentDate.date,
    duration: defaultEvent.duration || DEFAULT_EVENT_DURATION,
    all_day: defaultEvent.all_day || false,
    approved: false,
    rejected: false,
    highlighted: false,
    trending: false,

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

    errors: {}
  })

  const finish_at = useMemo(() => new Datetime(new Date(event.start_at.getTime() + event.duration), options), [event.start_at.getTime(), event.duration])
  const start_at = useMemo(() => new Datetime(event.start_at, options), [event.start_at.getTime()])

  function getStartDate() {
    return start_at.toInputDate()
  }

  function getStartTime() {
    return start_at.toInputTime()
  }

  function getFinishDate() {
    return finish_at.toInputDate()
  }

  function getFinishTime() {
    return finish_at.toInputTime()
  }

  function setError(key: string, description: string) {
    setEvent((current) => {
      return {
        ...current,
        errors: {
          ...current.errors,
          [key]: description
        }
      }
    })
  }

  function setErrors(errors: Record<string, string>) {
    setEvent((current) => {
      return {
        ...current,
        errors: errors
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
        errors
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
        errors
      }
    })
  }

  function handleChangeStartDate(value?: string) {
    const start_at = Datetime.fromInputDate(value || '', event.start_at, options).date

    if (start_at.getTime() !== event.start_at.getTime()) {
      let recurrent_until = event.recurrent_until
      if (recurrent_until !== null && recurrent_until.getTime() < start_at.getTime()) {
        recurrent_until = Datetime.fromInputTime('00:00', start_at, options).date
      }

      console.log(Datetime.fromInputDate(value || '', event.start_at, options).date)

      setValues({
        start_at,
        recurrent_until,
        recurrent_monthday: null,
        recurrent_setpos: null,
      })
    }
  }

  function handleChangeStartTime(value?: string) {
    const start_at = Datetime.fromInputTime(value || '', event.start_at, options).date
    if (start_at !== event.start_at) {
      setValues({ start_at })
    }
  }

  function handleChangeFinishDate(value?: string) {
    const finish_timestamp = Datetime.fromInputDate(value || '', finish_at.date, options).date.getTime()
    const duration = Math.max(0, finish_timestamp - event.start_at.getTime())
    if (duration !== event.duration) {
      setValues({ duration })
    }
  }

  function handleChangeFinishTime(value?: string) {
    const finish_timestamp = Datetime.fromInputTime(value || '', finish_at.date, options).date.getTime()
    const duration = Math.max(0, finish_timestamp - event.start_at.getTime())
    if (duration !== event.duration) {
      setValues({ duration })
    }
  }

  function handleChangeAllDay(value?: boolean) {
    if (!value) {
      setValue('all_day', false)
    } else {
      const start_at = Datetime.fromInputTime('00:00', event.start_at, options).date
      const finish_at_tmp = Datetime.fromInputTime('00:00', finish_at.date, options).date

      if (finish_at_tmp.getTime() < finish_at.getTime()) {
        finish_at_tmp.setUTCDate(finish_at_tmp.getUTCDate() + 1)
      }

      if (finish_at_tmp.getTime() <= start_at.getTime()) {
        finish_at_tmp.setUTCDate(start_at.getUTCDate() + 1)
      }

      setValues({
        start_at,
        duration: finish_at_tmp.getTime() - start_at.getTime(),
        all_day: true,
      })
    }
  }

  function handleChangePosition(name: 'x' | 'y', value?: string) {
    const position = Number(value)
    if (value === '') {
      setValue(name, value as any)
    } else if (position <= 150 && position >= -150) {
      setValue(name, position)
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
        recurrent_until: Datetime.fromInputTime('00:00', event.start_at, options).date,
        recurrent_count: null,
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
    if (value === '') {
      setValue('recurrent_interval', value as any)
    } else if (interval >= 1) {
      setValue('recurrent_interval', interval)
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

  function handleChangeRecurrentEnd(value: 'until' | 'count') {
    switch (value) {
      case 'until':
        return setValues({
          recurrent_until: Datetime.fromInputTime('00:00', event.start_at, options).date,
          recurrent_count: null,
        })
      case 'count':
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
    if (value === '') {
      setValue('recurrent_count', value as any)
    } else if (recurrent_count > 0 && recurrent_count <= MAX_EVENT_RECURRENT) {
      setValue('recurrent_count', recurrent_count)
    }
  }

  function handleChangeRecurrentUntil(value: string) {
    const recurrent_until = Datetime.fromInputDate(value, event.recurrent_until || event.start_at).date
    setValue('recurrent_until', recurrent_until)
  }

  function handleChange(e: React.ChangeEvent<any>, props?: { name: string, value: string, type: string, checked: boolean } | any) {
    const name = getName(e, props)
    const value = getValue(e, props)

    switch (name) {
      case 'name':
      case 'description':
      case 'details':
      case 'contact':
        return setValue(name, String(value || '').slice(0, eventSchema.properties[name].maxLength))

      case 'image':
      case 'url':
      case 'realm':
        return setValue(name, value)

      case 'highlighted':
      case 'trending':
      case 'rejected':
      case 'approved':
        return setValue(name, !!value)

      case 'x':
      case 'y':
        return handleChangePosition(name, value)

      case 'start_date':
        return handleChangeStartDate(value)

      case 'start_time':
        return handleChangeStartTime(value)

      case 'finish_date':
        return handleChangeFinishDate(value)

      case 'finish_time':
        return handleChangeFinishTime(value)

      case 'all_day':
        return handleChangeAllDay(value)

      case 'recurrent':
        return handleChangeRecurrent(value)

      case 'recurrent_interval':
        return handleChangeInterval(value)

      case 'recurrent_frequency':
        return handleChangeFrequency(value)

      case 'recurrent_weekday_mask[MONDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.MONDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.MONDAY))

      case 'recurrent_weekday_mask[TUESDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.TUESDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.TUESDAY))

      case 'recurrent_weekday_mask[WEDNESDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.WEDNESDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.WEDNESDAY))

      case 'recurrent_weekday_mask[THURSDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.THURSDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.THURSDAY))

      case 'recurrent_weekday_mask[FRIDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.FRIDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.FRIDAY))

      case 'recurrent_weekday_mask[SATURDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.SATURDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.SATURDAY))

      case 'recurrent_weekday_mask[SUNDAY]':
        return setValue('recurrent_weekday_mask', value ? (event.recurrent_weekday_mask || 0) | WeekdayMask.SUNDAY : (event.recurrent_weekday_mask || 0) & (~WeekdayMask.SUNDAY))

      case 'recurrent_monthday[current]':
        return handleChangeMonthlyDayRepeat()

      case 'recurrent_setpos[current]':
        return handleChangeMonthlyPositionRepeat()

      case 'recurrent_setpos[last]':
        return handleChangeMonthlyLastPositionRepeat()

      case 'recurrent_end':
        return handleChangeRecurrentEnd(value)

      case 'recurrent_count':
        return handleChangeRecurrentCount(value)

      case 'recurrent_until':
        return handleChangeRecurrentUntil(value)

      default:
      // ignore change
    }
  }

  function validate() {
    const errors: Record<string, string> = {}

    if (!event.name) {
      errors['name'] = 'Event name is required'
    }

    if (event.url && !isURL(event.url)) {
      errors['url'] = 'Event URL is invalid'
    }

    if (event.image && !isURL(event.image)) {
      errors['image'] = 'Event image is invalid'
    }

    if (event.x as any === '') {
      errors['x'] = 'Latitude is required'
    }

    if (event.y as any === '') {
      errors['y'] = 'Longitude is required'
    }

    if (event.recurrent_interval as any === '') {
      errors['recurrent_interval'] = 'Interval is invalid'
    }

    if (event.recurrent && event.recurrent_until === null && event.recurrent_count === null) {
      errors['recurrent_end'] = 'Missing recurrent end'
    } else if (event.recurrent_count as any === '') {
      errors['recurrent_count'] = 'Invalid count'
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
    setValue,
    setValues,
    setError,
    setErrors,
    handleChange,
    validate,
    toObject
  }

  return [event, actions] as const
}