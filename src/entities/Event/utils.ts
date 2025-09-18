import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { CatalystAbout } from "decentraland-gatsby/dist/utils/api/Catalyst.types"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"
import padStart from "lodash/padStart"
import { RRule, Weekday } from "rrule"

import {
  EventAttributes,
  EventTimeReference,
  EventType,
  MAX_EVENT_RECURRENT,
  MonthMask,
  Months,
  Position,
  RecurrentEventAttributes,
  WeekdayMask,
  Weekdays,
} from "./types"
import { mainRealmUrl } from "../../modules/servers"
import { ScheduleAttributes } from "../Schedule/types"

const JUMP_IN_SITE_URL = env(
  "JUMP_IN_SITE_URL",
  "https://decentraland.org/jump"
)
const EVENTS_BASE_URL = env(
  "EVENTS_BASE_URL",
  "https://events.decentraland.org"
)
const PROFILE_SITE_URL = env(
  "PROFILE_SITE_URL",
  "https://profile.decentraland.org"
)

const BUCKET_URL = env("AWS_BUCKET_URL")

export function profileSiteUrl(address: string) {
  const target = new URL(PROFILE_SITE_URL)
  target.pathname = `/accounts/${address}`
  return target.toString()
}

export function siteUrl(pathname = "") {
  const target = new URL(EVENTS_BASE_URL)
  target.pathname = (target.pathname + pathname).replace(/\/+/g, "/")
  return target
}

export function eventUrl(event: Pick<EventAttributes, "id">): string {
  const target = siteUrl("/event/")
  target.searchParams.set("id", event.id)
  return target.toString()
}

export function scheduleUrl(schedule: Pick<ScheduleAttributes, "id">): string {
  const target = siteUrl("/schedule/")
  target.searchParams.set("id", schedule.id)
  return target.toString()
}

/** deprecated user eventClientOptions, redirecto to play wont work in the future */
export function eventTargetUrl(
  event: Pick<EventAttributes, "x" | "y" | "server">
): string {
  const target = new URL(`${JUMP_IN_SITE_URL}/events`)
  target.pathname = ""
  target.searchParams.set("position", [event.x || 0, event.y || 0].join(","))

  if (event.server) {
    target.searchParams.set("realm", event.server)
  }

  return target.toString()
}

export function eventClientOptions(
  event: Pick<EventAttributes, "x" | "y" | "server" | "world">,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _servers?: (CatalystAbout | null)[] | null
): {
  position: string
  realm?: string
} {
  const options: {
    position: string
    realm?: string
  } = {
    position: [event.x || 0, event.y || 0].join(","),
  }

  if (event.world) {
    options.realm = event.server || undefined
  }

  return options
}

export function eventFacebookUrl(
  event: Pick<EventAttributes, "id" | "description">
): string {
  const target = new URL("https://www.facebook.com/sharer/sharer.php")
  target.searchParams.set("u", eventUrl(event))

  if (event.description) {
    target.searchParams.set("description", event.description)
  }

  return target.toString()
}

// TODO: This is used in the UI and the backend as well.
export function eventTwitterUrl(
  event: Pick<EventAttributes, "id" | "description">
): string {
  const target = new URL("https://twitter.com/intent/tweet")
  target.searchParams.set("hashtags", "decentraland,socialworld,virtualgames")

  const description: string[] = []
  if (event.description) {
    description.push(event.description)
  }

  description.push(eventUrl(event))
  target.searchParams.set("text", description.join(" "))
  return target.toString()
}

export function toMonthMask(date: Date | null | undefined) {
  if (!date) {
    return MonthMask.NONE
  }

  return Months[date.getUTCMonth()] || MonthMask.NONE
}

export function toRRule(options: RecurrentEventAttributes): RRule | null {
  if (
    !options.start_at ||
    !options.recurrent ||
    !options.recurrent_frequency ||
    (!options.recurrent_count && !options.recurrent_until)
  ) {
    return null
  }

  return new RRule({
    dtstart: options.start_at,
    freq: RRule[options.recurrent_frequency],
    interval: options.recurrent_interval || 1,
    until: options.recurrent_until,
    count: options.recurrent_count,
    byweekday: toRRuleWeekdays(options.recurrent_weekday_mask),
    bymonth: toRRuleMonths(options.recurrent_month_mask),
    bysetpos: options.recurrent_setpos,
    bymonthday: options.recurrent_monthday,
  })
}

export function futureRecurrentDates(
  options: RecurrentEventAttributes
): Date[] {
  const now = Date.now()
  let recurrentCount = 0

  return toRRuleDates(options, (date) => {
    if (date.getTime() >= now) {
      recurrentCount++
    }

    if (recurrentCount > MAX_EVENT_RECURRENT) {
      return false
    }

    return true
  }).filter(
    (date) => date.getTime() >= Math.max(now, options.start_at.getTime())
  )
}

export function toRRuleDates(
  options: RecurrentEventAttributes,
  iterator?: (d: Date, len: number) => boolean
): Date[] {
  const rrule = toRRule(options)

  if (rrule) {
    return rrule.all(iterator).map((date) => {
      date.setUTCHours(options.start_at.getUTCHours())
      date.setUTCMinutes(options.start_at.getUTCMinutes())
      date.setUTCSeconds(options.start_at.getUTCSeconds())
      date.setUTCMilliseconds(options.start_at.getUTCMilliseconds())
      return date
    })
  }

  return []
}

export function toRRuleMonths(mask: number) {
  return [
    mask & MonthMask.JANUARY && 1,
    mask & MonthMask.FEBRUARY && 2,
    mask & MonthMask.MARCH && 3,
    mask & MonthMask.APRIL && 4,
    mask & MonthMask.MAY && 5,
    mask & MonthMask.JUNE && 6,
    mask & MonthMask.JULY && 7,
    mask & MonthMask.AUGUST && 8,
    mask & MonthMask.SEPTEMBER && 9,
    mask & MonthMask.OCTOBER && 10,
    mask & MonthMask.NOVEMBER && 11,
    mask & MonthMask.DECEMBER && 12,
  ].filter(Boolean)
}

export function toWeekdayMask(date: Date | null | undefined) {
  if (!date) {
    return WeekdayMask.NONE
  }

  return Weekdays[date.getUTCDay()] || WeekdayMask.NONE
}

export function toRRuleWeekdays(mask: number) {
  return [
    mask & WeekdayMask.SUNDAY && RRule.SU,
    mask & WeekdayMask.MONDAY && RRule.MO,
    mask & WeekdayMask.TUESDAY && RRule.TU,
    mask & WeekdayMask.WEDNESDAY && RRule.WE,
    mask & WeekdayMask.THURSDAY && RRule.TH,
    mask & WeekdayMask.FRIDAY && RRule.FR,
    mask & WeekdayMask.SATURDAY && RRule.SA,
  ].filter(Boolean) as Weekday[]
}

export function toRecurrentSetpos(date: Date) {
  return Math.ceil(date.getUTCDate() / 7)
}

export function isLatestRecurrentSetpos(date: Date) {
  const tmp = new Date(date.getTime())
  tmp.setDate(tmp.getUTCDate() + 7)
  return date.getMonth() !== tmp.getMonth()
}

export function toRecurrentSetposName(date: Date) {
  const position = toRecurrentSetpos(date)
  switch (position) {
    case Position.FIRST:
      return "first"
    case Position.SECOND:
      return "second"
    case Position.THIRD:
      return "third"
    case Position.FOURTH:
      return "fourth"
    case Position.FIFTH:
      return "fifth"
    case Position.LAST:
      return "last"
    default:
      return ""
  }
}

export function calculateRecurrentProperties(
  event: Partial<RecurrentEventAttributes> &
    Partial<Pick<EventAttributes, "recurrent_dates">> &
    Pick<EventAttributes, "start_at" | "duration" | "finish_at">
): RecurrentEventAttributes &
  Pick<
    EventAttributes,
    "start_at" | "duration" | "finish_at" | "recurrent_dates"
  > {
  const now = Date.now()
  const start_at = Time.date(event.start_at)
  const finish_at = new Date(start_at.getTime() + event.duration)
  const duration = Math.max(event.duration, 0)
  const previous_recurrent_dates =
    (event.recurrent &&
      (event.recurrent_dates || []).filter(
        (date) => date.getTime() + duration <= now
      )) ||
    []
  const recurrent: RecurrentEventAttributes &
    Pick<
      EventAttributes,
      "start_at" | "duration" | "finish_at" | "recurrent_dates"
    > = {
    start_at,
    duration,
    finish_at,
    recurrent: false,
    recurrent_interval: 1,
    recurrent_frequency: null,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_until: null,
    recurrent_count: null,
    recurrent_dates: previous_recurrent_dates,
  }

  if (
    event.recurrent &&
    event.recurrent_frequency &&
    (event.recurrent_count || event.recurrent_until)
  ) {
    const recurrent_until =
      event.recurrent_until && Time.date(event.recurrent_until)
    recurrent.recurrent = event.recurrent
    recurrent.recurrent_interval = event.recurrent_interval || 1
    recurrent.recurrent_frequency =
      event.recurrent_frequency || recurrent.recurrent_frequency
    recurrent.recurrent_setpos =
      event.recurrent_setpos || recurrent.recurrent_setpos
    recurrent.recurrent_monthday =
      event.recurrent_monthday || recurrent.recurrent_monthday
    recurrent.recurrent_weekday_mask =
      event.recurrent_weekday_mask || recurrent.recurrent_weekday_mask
    recurrent.recurrent_month_mask =
      event.recurrent_month_mask || recurrent.recurrent_month_mask
    recurrent.recurrent_count =
      event.recurrent_count || recurrent.recurrent_count
    recurrent.recurrent_until = recurrent_until || recurrent.recurrent_until

    const recurrent_dates = futureRecurrentDates(recurrent)

    if (recurrent_dates.length) {
      const last_date = new Date(recurrent_dates[recurrent_dates.length - 1])
      last_date.setUTCHours(start_at.getUTCHours())
      last_date.setUTCMinutes(start_at.getUTCMinutes())
      last_date.setUTCSeconds(start_at.getUTCSeconds())
      last_date.setUTCMilliseconds(start_at.getUTCMilliseconds())
      recurrent.recurrent_dates = recurrent_dates
      recurrent.finish_at = new Date(last_date.getTime() + event.duration)
    }
  }

  if (recurrent.recurrent_dates.length === 0) {
    recurrent.recurrent_dates.push(start_at)
  }

  return recurrent
}

export function calculateNextRecurrentDates(
  event: EventAttributes
): Pick<EventAttributes, "next_start_at" | "next_finish_at"> {
  const now = Date.now()

  let temp_start_time_at = event.start_at

  if (
    !temp_start_time_at ||
    (temp_start_time_at && temp_start_time_at.getTime() + event.duration <= now)
  ) {
    temp_start_time_at =
      event.recurrent_dates.find(
        (date) => date.getTime() + event.duration > now
      ) || event.recurrent_dates[event.recurrent_dates.length - 1]
  }
  return {
    next_start_at: temp_start_time_at,
    next_finish_at: Time(temp_start_time_at).add(event.duration).toDate(),
  }
}

export function getEventType(type: string | null) {
  switch (type) {
    case EventType.One:
      return EventType.One

    case EventType.Recurrent:
      return EventType.Recurrent

    default:
      return EventType.All
  }
}

export function getEventTimeReference(type: string | null) {
  if (Object.values(EventTimeReference).includes(type as EventTimeReference)) {
    return type as EventTimeReference
  }
  return EventTimeReference.ALL
}

export function validateTime(time: string, defaultTime: number): number {
  let newTime = Number(time)
  if (isNaN(newTime) || newTime < 0 || newTime > 2400) {
    newTime = defaultTime
  }
  return newTime
}

/**
 * Takes a range of the day represented as two times formatted as `HHmm`
 * and return the same range represented as two times of the day in minutes
 * @param from - initial time of the day formatted as `HHmm`
 * @param to - end time of the day formatted as `HHmm`
 * @returns
 */
export function fromEventTime(from?: string | null, to?: string | null) {
  const fromTimeDefault = 0
  const toTimeDefault = 2400

  const fromTime = validateTime(from || "0000", fromTimeDefault)
  const toTime = validateTime(to || "2400", toTimeDefault)

  const fromTimeHour = Math.floor(fromTime / 100)
  const fromTimeMinute = fromTime % 100 === 30 ? 30 : 0
  const toTimeHour = Math.floor(toTime / 100)
  const toTimeMinute = toTime % 100 === 30 ? 30 : 0

  const fromInMinutes = fromTimeHour * 60 + fromTimeMinute
  let toInMinutes = toTimeHour * 60 + toTimeMinute

  if (fromInMinutes > toInMinutes) {
    toInMinutes = fromInMinutes
  }

  return [fromInMinutes, toInMinutes] as const
}

/**
 * Takes a range of the day represented as two times of the day in minutes
 * and return the same range represented as two times formatted as `HHmm`
 * @param fromInMinutes - initial time of the day in minutes
 * @param toInMinutes - end time of the day in minutes
 * @returns
 */
export function toEventTime(fromInMinutes?: number, toInMinutes?: number) {
  fromInMinutes = Math.min(Math.max(0, fromInMinutes ?? 0), 60 * 24)
  toInMinutes = Math.min(Math.max(0, toInMinutes ?? 60 * 24), 60 * 24)

  if (fromInMinutes > toInMinutes) {
    toInMinutes = fromInMinutes
  }

  return [
    formatMinutesDuration(fromInMinutes),
    formatMinutesDuration(toInMinutes),
  ] as const
}

export function formatMinutesDuration(minutes: number) {
  const duration = Time.duration(minutes, "minutes")
  return duration.days() === 0
    ? [
        padStart(duration.hours().toString(), 2, "0"),
        padStart(duration.minutes().toString(), 2, "0"),
      ].join("")
    : "2400"
}

export function isPastEvent(event: EventAttributes) {
  const now = Date.now()
  const finish_at = Time.date(event.finish_at)
  return finish_at.getTime() < now
}

export async function validateImageUrl(imageUrl: string) {
  const url = new URL(imageUrl)
  const whitelistedDomains = [BUCKET_URL].filter(
    (domain): domain is string => !!domain
  )

  if (!whitelistedDomains.some((domain) => domain.endsWith(url.host))) {
    throw new RequestError(
      `Invalid image url ${imageUrl}, please upload the image through the upload poster endpoint (POST /poster)`,
      RequestError.BadRequest
    )
  }

  return imageUrl
}
