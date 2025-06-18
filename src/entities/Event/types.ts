import { SQLStatement } from "decentraland-gatsby/dist/entities/Database/utils"
import Time from "decentraland-gatsby/dist/utils/date/Time"

export enum Frequency {
  YEARLY = "YEARLY",
  MONTHLY = "MONTHLY",
  WEEKLY = "WEEKLY",
  DAILY = "DAILY",
  HOURLY = "HOURLY",
  MINUTELY = "MINUTELY",
  SECONDLY = "SECONDLY",
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
  ALL = 0b111111111111,
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
  LAST = -1,
}

export const MAX_EVENT_RECURRENT = 10

export type EventAttributes = {
  id: string // primary key
  name: string
  image: string | null
  description: string
  start_at: Date
  finish_at: Date
  next_start_at: Date
  next_finish_at: Date
  duration: number
  all_day: boolean
  x: number
  y: number
  server: string | null
  url: string
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
  recurrent: boolean
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
  textsearch: SQLStatement | string | null | undefined
  categories: string[]
  schedules: string[]
  approved_by: string | null
  rejected_by: string | null
  world: boolean
}

export type GetEventParams = {
  event_id: string
}

export type DeprecatedEventAttributes = EventAttributes & {
  scene_name: string | null
  coordinates: [number, number]
}

export type SessionEventAttributes = DeprecatedEventAttributes & {
  attending: boolean
  live: boolean
  position: [number, number]
}

export type RecurrentEventAttributes = Pick<
  DeprecatedEventAttributes,
  | "start_at"
  | "duration"
  | "recurrent"
  | "recurrent_interval"
  | "recurrent_frequency"
  | "recurrent_setpos"
  | "recurrent_monthday"
  | "recurrent_weekday_mask"
  | "recurrent_month_mask"
  | "recurrent_until"
  | "recurrent_count"
>

export enum EventListType {
  All = "all",
  Active = "active",
  Live = "live",
  Upcoming = "upcoming",
  Relevance = "relevance",
}

export type EventListParams = {
  list?: EventListType
  creator?: string
  position?: string
  positions?: string[]
  estate_id?: string
  only_attendee?: boolean
  search?: string
  schedule?: string
  world?: boolean
  world_names?: string[]
  places_ids?: string[]
  limit?: number
  offset?: number
  order?: "asc" | "desc"
}

export type EventListOptions = {
  allow_pending?: boolean
  list?: EventListType
  user?: string
  creator?: string
  x?: number
  y?: number
  positions?: number[][]
  estate_id?: string
  only_attendee?: boolean
  search?: string
  schedule?: string
  world?: boolean
  world_names?: string[]
  places_ids?: string[]
  limit?: number
  offset?: number
  order?: "asc" | "desc"
  date?: string
}

export const editEventAttributes = [
  "image",
  "rejected",
  "name",
  "description",
  "start_at",
  "duration",
  "all_day",
  "x",
  "y",
  "server",
  "recurrent",
  "recurrent_frequency",
  "recurrent_setpos",
  "recurrent_monthday",
  "recurrent_weekday_mask",
  "recurrent_month_mask",
  "recurrent_interval",
  "recurrent_count",
  "recurrent_until",
  "categories",
  "world",
] as const

export const editOwnEventAttributes = ["contact", "details"] as const

export const editAnyEventAttributes = [
  "highlighted",
  "trending",
  "schedules",
  "url",
] as const

export const approveEventAttributes = ["approved"] as const

export const SITEMAP_ITEMS_PER_PAGE = 100

export const DEFAULT_EVENT_DURATION = Time.Hour
export const MAX_EVENT_DURATION = Time.Day

export enum EventType {
  All = "all",
  One = "one",
  Recurrent = "recurrent",
}

export enum EventTimeReference {
  ALL = "All",
  TODAY = "Today",
  TOMORROW = "Tomorrow",
  NEXT_WEEK = "Next 7 days",
  NEXT_MONTH = "Next 30 days",
  NEXT_90_DAYS = "Next 90 days",
  NEXT_120_DAYS = "Next 120 days",
}

export const MAX_CATAGORIES_ALLOWED = 1

export enum eventLocations {
  LAND = "land",
  WORLD = "world",
}
