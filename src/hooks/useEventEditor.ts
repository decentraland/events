import { useState } from "react";
import Events, { NewEvent, UpdateEvent } from "../api/Events";
import { date, fromInputTime, fromInputDate } from "../components/Date/utils";

export default function useEventEditor(defaultEvent: Partial<NewEvent> = {}) {
  const currentDate = date({ seconds: 0, milliseconds: 0 })
  const start_at = defaultEvent.start_at || currentDate
  const finish_at = defaultEvent.finish_at && defaultEvent.finish_at.getTime() > start_at.getDate() ? defaultEvent.finish_at : start_at
  const [event, setEvent] = useState<NewEvent & { errors: Record<string, string> }>({
    name: defaultEvent.name || '',
    description: defaultEvent.description || '',
    contact: defaultEvent.contact || '',
    details: defaultEvent.details || '',
    image: defaultEvent.image || '',
    coordinates: defaultEvent.coordinates || [0, 0],
    start_at: start_at,
    finish_at: finish_at,
    errors: {}
  })

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
    const start_at = fromInputDate(value || '', event.start_at)
    if (start_at !== event.start_at) {
      const finish_at = start_at.getTime() > event.finish_at.getTime() ? start_at : event.finish_at
      setValues({ start_at, finish_at })
    }
  }

  function handleChangeStartTime(value?: string) {
    const start_at = fromInputTime(value || '', event.start_at)
    if (start_at !== event.start_at) {
      const finish_at = start_at.getTime() > event.finish_at.getTime() ? start_at : event.finish_at
      setValues({ start_at, finish_at })
    }
  }

  function handleChangeFinishDate(value?: string) {
    const finish_at = fromInputDate(value || '', event.finish_at)
    if (finish_at !== event.finish_at) {
      setValue('finish_at', finish_at)
    }
  }

  function handleChangeFinishTime(value?: string) {
    const finish_at = fromInputTime(value || '', event.finish_at)
    if (finish_at !== event.finish_at) {
      setValue('finish_at', finish_at)
    }
  }

  function handleChangeCoordinates(value?: string) {
    let [x, y] = (value || '').split(',').map(Number)
    if (x <= 150 && x >= -150 && y <= 150 && y >= -150) {
      setValue('coordinates', [x, y])
    } else {
      setError('coordinates', 'Invalid coordinates')
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
      case 'image':
        return setValue(name, value)

      case 'coordinates':
        return handleChangeCoordinates(value)

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
    if (Object.values(event.errors).filter(Boolean).length) {
      return false
    }

    if (!event.name) {
      setError('name', 'Name is required')
      return false
    }

    return true
  }

  async function create() {
    const { errors, ...data } = event
    return Events.get().createEvent(data)

  }

  async function update(eventId: string, props: (keyof UpdateEvent)[] = ['name', 'description', 'image', 'contact', 'details', 'coordinates', 'start_at', 'finish_at']) {
    const data: UpdateEvent = {
      id: eventId
    }

    for (const prop of props) {
      (data as any)[prop] = (event as any)[prop]
    }

    return Events.get().updateEvent(data)
  }

  return [event, { setError, setErrors, handleChange, validate, create, update }] as const
}