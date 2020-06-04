import { useState } from "react";
import { eventSchema } from "../entities/Event/types";
import { EditEvent } from "../api/Events";
import { date, fromUTCInputTime, fromUTCInputDate, toUTCInputDate, toUTCInputTime } from "decentraland-gatsby/dist/components/Date/utils";
import isURL from "validator/lib/isURL";

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
    approved: false,
    rejected: false,
    highlighted: false,
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

  function handleChange(event: React.ChangeEvent<any>, props?: { name: string, value: string, type: string, checked: boolean } | any) {
    const name = getName(event, props)
    const value = getValue(event, props)

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