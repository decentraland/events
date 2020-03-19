export type EventAttributes = {
  id: string // primary key
  name: string
  image: string
  description: string
  start_at: Date
  finish_at: Date
  coordinates: [number, number]
  user: string
  approved: boolean
  created_at: Date
  contact: string,
  details: string
}

export type PublicEventAttributes = Omit<EventAttributes, 'contact' | 'details'> & {
  attending: boolean
  total_attendees: number,
  latest_attendees: string[]
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
  'name',
  'description',
  'start_at',
  'finish_at',
  'coordinates',
]