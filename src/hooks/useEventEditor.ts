import { useState } from "react";
import { eventSchema } from "../entities/Event/types";
import Events, { NewEvent, UpdateEvent } from "../api/Events";
import { date, fromUTCInputTime, fromUTCInputDate, toUTCInputDate, toUTCInputTime } from "decentraland-gatsby/dist/components/Date/utils";
import isURL from "validator/lib/isURL";

const DEFAULT_EVENT_DURATION = 1000 * 60 * 60

type EventEditorState = NewEvent & {
  errors: Record<string, string>
}

export default function useEventEditor(defaultEvent: Partial<NewEvent> = {}) {
  const currentDate = date({ seconds: 0, milliseconds: 0 })
  const start_at = defaultEvent.start_at || currentDate
  const finish_at = defaultEvent.finish_at && defaultEvent.finish_at.getTime() > start_at.getDate() ? defaultEvent.finish_at : new Date(start_at.getTime() + DEFAULT_EVENT_DURATION)
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
    start_at: start_at,
    finish_at: finish_at,
    errors: {}
  })

  function getStartDate() {
    return toUTCInputDate(event.start_at)
  }

  function getStartTime() {
    return toUTCInputTime(event.start_at)
  }

  function getFinishDate() {
    return toUTCInputDate(event.finish_at)
  }

  function getFinishTime() {
    return toUTCInputTime(event.finish_at)
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

  function setValue<K extends keyof NewEvent>(key: K, value: NewEvent[K]) {
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

  function setValues(event: Partial<NewEvent>) {
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
    const start_at = fromUTCInputDate(value || '', event.start_at)
    if (start_at !== event.start_at) {
      const finish_at = start_at.getTime() > event.finish_at.getTime() ? new Date(start_at.getTime() + DEFAULT_EVENT_DURATION) : event.finish_at
      setValues({ start_at, finish_at })
    }
  }

  function handleChangeStartTime(value?: string) {
    const start_at = fromUTCInputTime(value || '', event.start_at)
    if (start_at !== event.start_at) {
      const finish_at = start_at.getTime() > event.finish_at.getTime() ? new Date(start_at.getTime() + DEFAULT_EVENT_DURATION) : event.finish_at
      setValues({ start_at, finish_at })
    }
  }

  function handleChangeFinishDate(value?: string) {
    const finish_at = fromUTCInputDate(value || '', event.finish_at)
    if (finish_at !== event.finish_at) {
      setValue('finish_at', finish_at)

      if (finish_at.getTime() < event.start_at.getTime()) {
        setError('finish_at', 'Event must not end before it begins')
      }
    }
  }

  function handleChangeFinishTime(value?: string) {
    const finish_at = fromUTCInputTime(value || '', event.finish_at)
    if (finish_at !== event.finish_at) {
      setValue('finish_at', finish_at)

      if (finish_at.getTime() < event.start_at.getTime()) {
        setError('finish_at', 'Event must not end before it begins')
      }
    }
  }

  function handleChangePosition(name: 'x' | 'y', value?: string) {
    const position = Number(value)
    if (value === '') {
      setValue(name, value as any)
    } else if (position <= 150 && position >= -150) {
      setValue(name, position)
    } else {
      setError(name, 'Invalid coordinates')
    }
  }

  function handleChange(event: React.ChangeEvent<any>, props?: { name: string, value: string, type: string } | any) {
    const name: keyof NewEvent | 'start_time' | 'start_date' | 'finish_time' | 'finish_date' = props && props.name || event.target.name
    const value = props && props.value || event.target.value

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

    if (Object.values(errors).filter(Boolean).length) {
      setErrors({ ...event.errors, ...errors })
      return false
    }

    if (Object.values(event.errors).filter(Boolean).length) {
      return false
    }

    return true
  }

  async function create() {
    const { errors, ...data } = event
    return Events.get().createEvent(data)

  }

  async function update(eventId: string, props: (keyof UpdateEvent)[] = ['name', 'description', 'image', 'contact', 'details', 'x', 'y', 'realm', 'url', 'start_at', 'finish_at']) {
    const data: UpdateEvent = {
      id: eventId
    }

    for (const prop of props) {
      (data as any)[prop] = (event as any)[prop]
    }

    return Events.get().updateEvent(data)
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
    create,
    update
  }

  return [event, actions] as const
}