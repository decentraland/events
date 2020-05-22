export type EventAttributes = {
  id: string // primary key
  name: string
  image: string
  description: string
  start_at: Date
  finish_at: Date
  coordinates: [number, number]
  url: string | null
  user: string
  scene_name: string | null
  user_name: string | null
  approved: boolean
  rejected: boolean
  created_at: Date
  updated_at: Date
  contact: string | null,
  details: string | null,
  total_attendees: number,
  latest_attendees: string[]
}

export type SessionEventAttributes = EventAttributes & {
  attending: boolean
  editable: boolean
  owned: boolean
}

export type EventListOptions = {
  user: string | null | undefined,
  limit: number | null | undefined,
  offset: number | null | undefined,
  onlyAttendee: boolean
}

export const patchAttributes: (keyof EventAttributes)[] = [
  'name',
  'description',
  'start_at',
  'finish_at',
  'coordinates',
  'contact',
  'details',
]

export const adminPatchAttributes: (keyof EventAttributes)[] = [
  'image',
  'approved',
  'rejected',
  'name',
  'description',
  'start_at',
  'finish_at',
  'url',
  'scene_name',
  'coordinates',
]