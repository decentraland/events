export enum Frequency {
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
  HOURLY = 'HOURLY',
  MINUTELY = 'MINUTELY',
  SECONDLY = 'SECONDLY',
}

export const Frequencies = [
  Frequency.YEARLY,
  Frequency.MONTHLY,
  Frequency.WEEKLY,
  Frequency.DAILY,
  Frequency.HOURLY,
  Frequency.MINUTELY,
  Frequency.SECONDLY,
]

export enum WeekdayMask {
  NONE = 0,
  SUNDAY = 1 << 0,
  MONDAY = 1 << 1,
  TUESDAY = 1 << 2,
  WEDNESDAY = 1 << 3,
  THURSDAY = 1 << 4,
  FRIDAY = 1 << 5,
  SATURDAY = 1 << 6,
  ALL = 0b1111111,
}

export const Weekdays = [
  WeekdayMask.SUNDAY,
  WeekdayMask.MONDAY,
  WeekdayMask.TUESDAY,
  WeekdayMask.WEDNESDAY,
  WeekdayMask.THURSDAY,
  WeekdayMask.FRIDAY,
  WeekdayMask.SATURDAY,
]

export enum MonthMask {
  NONE = 0,
  JANUARY = 1 << 0,
  FEBRUARY = 1 << 1,
  MARCH = 1 << 2,
  APRIL = 1 << 3,
  MAY = 1 << 4,
  JUNE = 1 << 5,
  JULY = 1 << 6,
  AUGUST = 1 << 7,
  SEPTEMBER = 1 << 8,
  OCTOBER = 1 << 9,
  NOVEMBER = 1 << 10,
  DECEMBER = 1 << 11,
  ALL = 0b111111111111
}

export const Months = [
  MonthMask.JANUARY,
  MonthMask.FEBRUARY,
  MonthMask.MARCH,
  MonthMask.APRIL,
  MonthMask.MAY,
  MonthMask.JUNE,
  MonthMask.JULY,
  MonthMask.AUGUST,
  MonthMask.SEPTEMBER,
  MonthMask.OCTOBER,
  MonthMask.NOVEMBER,
  MonthMask.DECEMBER,
]

export enum Position {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 5,
  LAST = -1
}

export const MAX_EVENT_RECURRENT = 10

export type EventAttributes = {
  id: string // primary key
  name: string
  image: string | null
  description: string
  start_at: Date
  next_start_at: Date
  finish_at: Date
  duration: number
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
  trending: boolean
  created_at: Date
  updated_at: Date
  recurrent: boolean,
  recurrent_frequency: Frequency | null
  recurrent_setpos: Position | null
  recurrent_monthday: number | null
  recurrent_weekday_mask: number
  recurrent_month_mask: number
  recurrent_interval: number
  recurrent_count: number | null
  recurrent_until: Date | null
  recurrent_dates: Date[]
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
  notify: boolean
  editable: boolean
  owned: boolean
  live: boolean
  position: [number, number]
}

export type RecurrentEventAttributes = Pick<
  DeprecatedEventAttributes,
  'start_at' |
  'recurrent' |
  'recurrent_interval' |
  'recurrent_frequency' |
  'recurrent_setpos' |
  'recurrent_monthday' |
  'recurrent_weekday_mask' |
  'recurrent_month_mask' |
  'recurrent_until' |
  'recurrent_count'
>

export type EventListOptions = {
  currentUser: string | null | undefined,
  user: string | null | undefined,
  limit: number | null | undefined,
  offset: number | null | undefined,
  x: number | null | undefined,
  y: number | null | undefined,
  startIn: number | null | undefined,
  estateId: string | null | undefined,
  onlyAttendee: boolean
  onlyUpcoming: boolean
}

export const editableAttributes: (keyof EventAttributes)[] = [
  'image',
  'rejected',
  'name',
  'description',
  'start_at',
  'duration',
  'all_day',
  'x',
  'y',
  'realm',
  'recurrent',
  'recurrent_frequency',
  'recurrent_setpos',
  'recurrent_monthday',
  'recurrent_weekday_mask',
  'recurrent_month_mask',
  'recurrent_interval',
  'recurrent_count',
  'recurrent_until',
]

export const patchAttributes: (keyof EventAttributes)[] = editableAttributes.concat([
  'contact',
  'details',
])

export const adminPatchAttributes: (keyof EventAttributes)[] = editableAttributes.concat([
  'approved',
  'highlighted',
  'trending',
  'url',
])

export const SITEMAP_ITEMS_PER_PAGE = 100

export const eventSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'start_at',
    'duration',
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
    trending: {
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
    duration: {
      type: 'number',
      minimum: 0,
    },
    all_day: {
      type: 'boolean'
    },
    recurrent: {
      type: 'boolean'
    },
    recurrent_frequency: {
      type: ['string', 'null'],
      enum: [...Frequencies, null]
    },
    recurrent_setpos: {
      type: ['number', 'null'],
      minimum: 0
    },
    recurrent_monthday: {
      type: ['number', 'null']
    },
    recurrent_weekday_mask: {
      type: 'number',
      minimum: 0
    },
    recurrent_month_mask: {
      type: 'number',
      minimum: 0
    },
    recurrent_interval: {
      type: 'number',
      minimum: 0
    },
    recurrent_count: {
      type: ['number', 'null']
    },
    recurrent_until: {
      type: ['string', 'null'],
      format: 'date-time'
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