export type EventAttributes = {
  id: string // primary key
  name: string
  image: string | null
  description: string
  start_at: Date
  finish_at: Date
  all_day: boolean
  x: number
  y: number
  realm: string | null
  url: string | null
  user: string
  estate_id: string | null
  estate_name: string | null
  user_name: string | null
  approved: boolean
  rejected: boolean
  highlighted: boolean
  created_at: Date
  updated_at: Date
  contact: string | null
  details: string | null
  total_attendees: number
  latest_attendees: string[]
}

export type DeprecatedEventAttributes = EventAttributes & {
  scene_name: string | null
  coordinates: [number, number]
}

export type SessionEventAttributes = DeprecatedEventAttributes & {
  attending: boolean
  editable: boolean
  owned: boolean
  position: [number, number]
}

export type EventListOptions = {
  user: string | null | undefined,
  limit: number | null | undefined,
  offset: number | null | undefined,
  x: number | null | undefined,
  y: number | null | undefined,
  estateId: string | null | undefined,
  onlyAttendee: boolean
}

export const patchAttributes: (keyof EventAttributes)[] = [
  'name',
  'description',
  'start_at',
  'finish_at',
  'all_day',
  'x',
  'y',
  'realm',
  'contact',
  'details',
]

export const adminPatchAttributes: (keyof EventAttributes)[] = [
  'image',
  'approved',
  'rejected',
  'highlighted',
  'name',
  'description',
  'start_at',
  'finish_at',
  'all_day',
  'x',
  'y',
  'realm',
  'url',
]

export const eventSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'start_at',
    'finish_at',
    'x',
    'y',
  ],
  properties: {
    name: {
      type: 'string',
      minLength: 0,
      maxLength: 150,
    },
    description: {
      type: ['string', 'null'],
      minLength: 0,
      maxLength: 5000,
    },
    approved: {
      type: 'boolean'
    },
    rejected: {
      type: 'boolean'
    },
    highlighted: {
      type: 'boolean'
    },
    image: {
      type: ['string', 'null'],
      format: 'url',
      optional: true,
    },
    start_at: {
      type: 'string',
      format: 'date-time'
    },
    finish_at: {
      type: 'string',
      format: 'date-time'
    },
    all_day: {
      type: 'boolean'
    },
    x: {
      type: 'number',
      maximum: 150,
      minimum: -150,
    },
    y: {
      type: 'number',
      maximum: 150,
      minimum: -150,
    },
    realm: {
      type: ['string', 'null'],
    },
    contact: {
      type: ['string', 'null'],
      minLength: 0,
      maxLength: 100,
    },
    details: {
      type: ['string', 'null'],
      minLength: 0,
      maxLength: 5000,
    },
    url: {
      type: 'string',
      format: 'url',
    }
  }
}