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
  contact: string,
  details: string,
  total_attendees: number,
  latest_attendees: string[]
}

export type PublicEventAttributes = Omit<EventAttributes, 'contact' | 'details'> & {
  attending: boolean
  editable: boolean
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