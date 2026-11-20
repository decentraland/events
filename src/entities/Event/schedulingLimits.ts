import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import Time from "decentraland-gatsby/dist/utils/date/Time"

import EventModel from "./model"
import {
  EventAttributes,
  Frequency,
  GENESIS_PLAZA_POSITION,
  MAX_DAILY_EVENT_DURATION,
  MAX_EVENTS_PER_PLACE_PER_DAY,
  PLACE_DAILY_LIMIT_HORIZON,
  RecurrentEventAttributes,
  SchedulingLimitErrorCode,
} from "./types"
import { toRRule } from "./utils"
import { PlaceAttributes } from "../../api/Places"
import { ProfileSettingsAttributes } from "../ProfileSettings/types"
import { canApproveAnyEvent, canEditAnyEvent } from "../ProfileSettings/utils"

// Frequencies that always put an occurrence on every day (or more often).
const DAILY_FREQUENCIES = new Set<Frequency>([
  Frequency.DAILY,
  Frequency.HOURLY,
  Frequency.MINUTELY,
  Frequency.SECONDLY,
])

// Hard stop on how many occurrences one rule may emit while checking the
// per-place limit. Only an HOURLY rule gets near it inside the horizon.
const MAX_OCCURRENCES_SCANNED = 10_000

/**
 * Where an event happens, for the per-place limit: a World (by name) or a set
 * of Genesis City parcels (the whole scene when the Places API knows it, else
 * the event's own parcel).
 */
export type SchedulingPlace =
  | { world: true; name: string }
  | { world: false; positions: Array<[number, number]>; genesisPlaza: boolean }

type EventLocation = Pick<EventAttributes, "world" | "server" | "x" | "y">

/**
 * The team (admin wallets and moderators) may schedule outside the creator
 * limits, e.g. a 24-hour daily event or a third event at a busy venue.
 */
export function canBypassSchedulingLimits(
  user: string,
  profile: ProfileSettingsAttributes
): boolean {
  return (
    isAdmin(user) || canApproveAnyEvent(profile) || canEditAnyEvent(profile)
  )
}

/**
 * Whether a recurring event happens every day. True for DAILY (or finer)
 * rules, and for any rule whose upcoming occurrences fall a day or less apart
 * (e.g. a weekly rule with every weekday selected).
 */
export function isDailyEvent(
  event: Pick<
    EventAttributes,
    "recurrent" | "recurrent_frequency" | "recurrent_dates"
  >
): boolean {
  if (!event.recurrent) {
    return false
  }

  if (
    event.recurrent_frequency &&
    DAILY_FREQUENCIES.has(event.recurrent_frequency)
  ) {
    return true
  }

  const times = (event.recurrent_dates || [])
    .map((date) => Time.date(date).getTime())
    .sort((a, b) => a - b)
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] <= Time.Day) {
      return true
    }
  }

  return false
}

/**
 * Daily events may last at most MAX_DAILY_EVENT_DURATION (2 hours).
 * `event` must hold the computed recurrence (`calculateRecurrentProperties`).
 */
export function validateDailyEventDuration(
  event: Pick<
    EventAttributes,
    "recurrent" | "recurrent_frequency" | "recurrent_dates" | "duration"
  >,
  body: unknown
) {
  if (isDailyEvent(event) && event.duration > MAX_DAILY_EVENT_DURATION) {
    throw new RequestError(
      `Daily events can last up to ${
        MAX_DAILY_EVENT_DURATION / Time.Hour
      } hours`,
      RequestError.BadRequest,
      { code: SchedulingLimitErrorCode.DailyEventTooLong, body }
    )
  }
}

function parsePosition(position: string): [number, number] | null {
  const [x, y] = position.split(",").map(Number)
  return Number.isInteger(x) && Number.isInteger(y) ? [x, y] : null
}

/**
 * Resolve the place an event is scheduled at. `place` is the Places API
 * scene at the event's parcel (null for Worlds, empty parcels, or when the
 * Places API is unavailable).
 */
export function resolveSchedulingPlace(
  event: EventLocation,
  place: Pick<PlaceAttributes, "positions"> | null | undefined
): SchedulingPlace {
  if (event.world && event.server) {
    return { world: true, name: event.server.toLowerCase() }
  }

  const positions = (place?.positions || [])
    .map(parsePosition)
    .filter((position): position is [number, number] => position !== null)
  if (!positions.some(([x, y]) => x === event.x && y === event.y)) {
    positions.push([event.x, event.y])
  }

  const genesisPlaza = place?.positions?.length
    ? place.positions.includes(GENESIS_PLAZA_POSITION)
    : `${event.x},${event.y}` === GENESIS_PLAZA_POSITION

  return { world: false, positions, genesisPlaza }
}

export function isSameLocation(a: EventLocation, b: EventLocation): boolean {
  return (
    Boolean(a.world) === Boolean(b.world) &&
    (a.server || "").toLowerCase() === (b.server || "").toLowerCase() &&
    a.x === b.x &&
    a.y === b.y
  )
}

function toUtcDay(time: number): number {
  return Math.floor(time / Time.Day)
}

function formatUtcDay(day: number): string {
  return new Date(day * Time.Day).toISOString().slice(0, 10)
}

/**
 * UTC days (days since the epoch) on which `event` has an occurrence that
 * starts inside [from, to).
 */
export function occurrenceDaysBetween(
  event: RecurrentEventAttributes,
  from: number,
  to: number
): Set<number> {
  const days = new Set<number>()
  const start_at = Time.date(event.start_at)
  const rrule = toRRule({
    ...event,
    start_at,
    recurrent_until: event.recurrent_until
      ? Time.date(event.recurrent_until)
      : null,
  })

  const starts = rrule
    ? rrule.between(
        new Date(from),
        new Date(to),
        /* inc */ true,
        (_date, len) => len < MAX_OCCURRENCES_SCANNED
      )
    : [start_at]

  for (const date of starts) {
    const time = date.getTime()
    if (time >= from && time < to) {
      days.add(toUtcDay(time))
    }
  }

  return days
}

export type PlaceDailyLimitOptions = {
  // The event as it will be saved (computed recurrence included).
  event: RecurrentEventAttributes
  place: SchedulingPlace
  // The event being edited, left out of the count.
  eventId?: string | null
  // The saved schedule of the event being edited at the same place. Days it
  // already held are not re-checked, so routine edits of an event at a venue
  // that was over the limit before this rule keep working.
  previous?: RecurrentEventAttributes | null
  body?: unknown
  now?: Date
}

/**
 * A place may host at most MAX_EVENTS_PER_PLACE_PER_DAY events per UTC day,
 * counting every creator's pending and approved events (rejected and deleted
 * ones free their slot). Genesis Plaza is exempt. Recurring events are
 * checked over PLACE_DAILY_LIMIT_HORIZON from their first occurrence.
 */
export async function validatePlaceDailyLimit(options: PlaceDailyLimitOptions) {
  const { event, place } = options
  if (!place.world && place.genesisPlaza) {
    return
  }

  const now = (options.now || new Date()).getTime()
  // The horizon runs from the event's first occurrence, so an event scheduled
  // far ahead is still checked.
  const horizonEnd =
    Math.max(now, Time.date(event.start_at).getTime()) +
    PLACE_DAILY_LIMIT_HORIZON
  // Any occurrence that hasn't ended yet, including one live right now.
  const days = occurrenceDaysBetween(event, now - event.duration, horizonEnd)
  if (options.previous) {
    const previousDays = occurrenceDaysBetween(
      options.previous,
      now - options.previous.duration,
      horizonEnd
    )
    for (const day of previousDays) {
      days.delete(day)
    }
  }

  if (days.size === 0) {
    return
  }

  const sortedDays = Array.from(days).sort((a, b) => a - b)
  const windowStart = sortedDays[0] * Time.Day
  const windowEnd = (sortedDays[sortedDays.length - 1] + 1) * Time.Day

  const others = await EventModel.getActiveEventsAtPlace({
    world_name: place.world ? place.name : null,
    positions: place.world ? [] : place.positions,
    exclude_id: options.eventId || null,
    start_before: new Date(windowEnd),
  })

  const counts = new Map<number, number>()
  for (const other of others) {
    for (const day of occurrenceDaysBetween(other, windowStart, windowEnd)) {
      if (days.has(day)) {
        counts.set(day, (counts.get(day) || 0) + 1)
      }
    }
  }

  const fullDay = sortedDays.find(
    (day) => (counts.get(day) || 0) >= MAX_EVENTS_PER_PLACE_PER_DAY
  )
  if (fullDay !== undefined) {
    const date = formatUtcDay(fullDay)
    throw new RequestError(
      `This place already has ${MAX_EVENTS_PER_PLACE_PER_DAY} events scheduled on ${date} (UTC). Each place can host up to ${MAX_EVENTS_PER_PLACE_PER_DAY} events per day`,
      RequestError.BadRequest,
      {
        code: SchedulingLimitErrorCode.PlaceDailyLimitReached,
        date,
        body: options.body,
      }
    )
  }
}
