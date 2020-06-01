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
  highlighted: boolean
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
  'highlighted',
  'name',
  'description',
  'start_at',
  'finish_at',
  'url',
  'scene_name',
  'coordinates',
]

export const eventSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'start_at',
    'finish_at',
    'coordinates'
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
    coordinates: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'number',
        maximum: 150,
        minimum: -150,
      }
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
    },
    scene_name: {
      type: ['string', 'null'],
      minLength: 0,
      maxLength: 500,
    }
  }
}