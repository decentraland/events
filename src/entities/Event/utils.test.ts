import {
  EventTimeSlot,
  Frequency,
  MAX_EVENT_DURATION,
  MAX_EVENT_RECURRENT,
  MAX_EVENT_TIME_SLOTS,
} from "./types"
import {
  applyTimeOfDay,
  calculateNextRecurrentDates,
  calculateRecurrentProperties,
  datesForDay,
  estimateRecurrentPastIterations,
  finishForDate,
  fromEventTime,
  futureRecurrentDates,
  minutesOfDay,
  normalizeTimeSlots,
  slotForDate,
  toEventTime,
  validateTimeSlots,
} from "./utils"

test(`fromEventTime`, () => {
  expect(fromEventTime()).toEqual([0, 60 * 24])
  expect(fromEventTime("0000", "2400")).toEqual([0, 24 * 60])
  expect(fromEventTime("0000", "4800")).toEqual([0, 24 * 60])
  expect(fromEventTime("0030", "2330")).toEqual([30, 23 * 60 + 30])
  expect(fromEventTime("0059", "2330")).toEqual([0, 23 * 60 + 30])
  expect(fromEventTime("0999", "0999")).toEqual([9 * 60, 9 * 60])
  expect(fromEventTime("1200", "0000")).toEqual([12 * 60, 12 * 60])
})

test(`toEventTime`, () => {
  expect(toEventTime()).toEqual(["0000", "2400"])
  expect(toEventTime(0, 24 * 60)).toEqual(["0000", "2400"])
  expect(toEventTime(0, 48 * 60)).toEqual(["0000", "2400"])
  expect(toEventTime(30, 23 * 60 + 30)).toEqual(["0030", "2330"])
  expect(toEventTime(12 * 60, 0)).toEqual(["1200", "1200"])
})

describe("futureRecurrentDates", () => {
  const baseRecurrence = {
    duration: 60 * 60 * 1000,
    recurrent: true,
    recurrent_interval: 1,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_count: null,
    recurrent_until: null,
  }

  describe("when the event is not recurrent", () => {
    it("should return an empty array", () => {
      const dates = futureRecurrentDates({
        ...baseRecurrence,
        recurrent: false,
        recurrent_frequency: null,
        start_at: new Date(),
      })
      expect(dates).toEqual([])
    })
  })

  describe("when recurrent_until is already in the past", () => {
    it("should return an empty array", () => {
      const dates = futureRecurrentDates({
        ...baseRecurrence,
        start_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.DAILY,
        recurrent_until: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      expect(dates).toEqual([])
    })
  })

  describe("when the recurrence is MONTHLY with no monthday mask set", () => {
    it("should infer bymonthday from start_at and produce MAX_EVENT_RECURRENT future dates", () => {
      // start_at one month ago — by moving the day-of-month to a value
      // that wouldn't be inferred from `now`, we exercise rrule's default
      // inference from dtstart. Without the byweekday:[]/bymonth:[] fix,
      // MONTHLY would also yield empty results.
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const dates = futureRecurrentDates({
        ...baseRecurrence,
        start_at: oneMonthAgo,
        recurrent_frequency: Frequency.MONTHLY,
        recurrent_until: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
      })
      expect(dates.length).toBeGreaterThan(1)
    })
  })

  describe("when the recurrence is WEEKLY with no weekday mask set", () => {
    it("should infer the weekday from start_at and produce MAX_EVENT_RECURRENT future dates", () => {
      // start_at one year ago on a known weekday (Thursday for most years)
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      const options = {
        start_at: oneYearAgo,
        duration: 60 * 60 * 1000,
        recurrent: true,
        recurrent_interval: 1,
        recurrent_frequency: Frequency.WEEKLY,
        recurrent_setpos: null,
        recurrent_monthday: null,
        recurrent_weekday_mask: 0,
        recurrent_month_mask: 0,
        recurrent_count: null,
        recurrent_until: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      }

      const dates = futureRecurrentDates(options)

      // Without the fix, rrule receives `byweekday: []` and returns zero
      // dates, producing the `[start_at]` fallback (length 1).
      expect(dates.length).toBeGreaterThan(1)
    })
  })

  describe("when start_at is years in the past with an absurdly large recurrent_count", () => {
    it("should not allocate past dates and should return MAX_EVENT_RECURRENT future dates", () => {
      const options = {
        start_at: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
        duration: 60 * 60 * 1000,
        recurrent: true,
        recurrent_interval: 1,
        recurrent_frequency: Frequency.HOURLY,
        recurrent_setpos: null,
        recurrent_monthday: null,
        recurrent_weekday_mask: 0,
        recurrent_month_mask: 0,
        recurrent_count: 2_000_000_000,
        recurrent_until: null,
      }

      const started = Date.now()
      const dates = futureRecurrentDates(options)
      const elapsed = Date.now() - started

      // Before the between() refactor, rrule.all(iterator) pushed every
      // past hour into the result array (~17k Date objects for 2 years)
      // before the filter stripped them. Scaling start_at further back
      // crashed the process. Now past occurrences are iterated internally
      // by rrule but never allocated, and our iterator only runs on
      // future dates. The timing bound is generous because jest workers
      // run in parallel under load; we only care that the call doesn't
      // hang or OOM.
      expect(elapsed).toBeLessThan(5000)
      expect(dates.length).toBe(MAX_EVENT_RECURRENT)
      for (const date of dates) {
        expect(date.getTime()).toBeGreaterThanOrEqual(started)
      }
    })
  })
})

describe("estimateRecurrentPastIterations", () => {
  // Default to a future recurrent_until so the estimator's terminator
  // gate (mirrors toRRule — rules without count or until are treated
  // as non-recurring and return 0) doesn't short-circuit tests that
  // are exercising the span math.
  const farFutureUntil = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
  const baseOptions = {
    start_at: new Date(),
    recurrent: true,
    recurrent_interval: 1,
    recurrent_frequency: Frequency.DAILY,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_count: null,
    recurrent_until: farFutureUntil,
  }

  describe("when the event is not recurrent", () => {
    it("should return 0", () => {
      expect(
        estimateRecurrentPastIterations({ ...baseOptions, recurrent: false })
      ).toBe(0)
    })
  })

  describe("when start_at is in the future", () => {
    it("should return 0", () => {
      expect(
        estimateRecurrentPastIterations({
          ...baseOptions,
          start_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          recurrent_frequency: Frequency.HOURLY,
        })
      ).toBe(0)
    })
  })

  describe("when neither recurrent_count nor recurrent_until is set", () => {
    it("should return 0 because the rule won't actually iterate", () => {
      expect(
        estimateRecurrentPastIterations({
          ...baseOptions,
          start_at: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
          recurrent_count: null,
          recurrent_until: null,
        })
      ).toBe(0)
    })
  })

  describe("when recurrent_until is already in the past", () => {
    it("should bound the iteration estimate by (until - start_at), not (now - start_at)", () => {
      // start_at 6 years ago, until 3 years ago. rrule will iterate
      // from start_at to until, not from start_at to now. With the
      // naive (now - start_at) span, an HOURLY rule here would
      // over-estimate to ~53k and trip the cap; the accurate count
      // is ~26k.
      const sixYearsAgo = new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000)
      const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: sixYearsAgo,
        recurrent_frequency: Frequency.HOURLY,
        recurrent_until: threeYearsAgo,
      })
      expect(result).toBeGreaterThan(25_000)
      expect(result).toBeLessThan(28_000)
    })
  })

  describe("when the rule is DAILY and start_at is 5 years in the past", () => {
    it("should estimate roughly 5 years of days", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
      })
      expect(result).toBeGreaterThan(1800)
      expect(result).toBeLessThan(1900)
    })
  })

  describe("when the rule is HOURLY and start_at is 1 year in the past", () => {
    it("should estimate roughly 8760 iterations", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.HOURLY,
      })
      expect(result).toBeGreaterThan(8700)
      expect(result).toBeLessThan(8800)
    })
  })

  describe("when recurrent_count is smaller than the span estimate", () => {
    it("should be bounded by recurrent_count", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.HOURLY,
        recurrent_count: 500,
      })
      expect(result).toBe(500)
    })
  })

  describe("when recurrent_count is larger than the span estimate", () => {
    it("should be bounded by the time span", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.DAILY,
        recurrent_count: 1000,
      })
      expect(result).toBeGreaterThan(6.5)
      expect(result).toBeLessThan(7.5)
    })
  })

  describe("when the rule is WEEKLY and start_at is 2 years in the past", () => {
    it("should estimate roughly 104 iterations", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.WEEKLY,
      })
      expect(result).toBeGreaterThan(100)
      expect(result).toBeLessThan(110)
    })
  })

  describe("when the rule is MONTHLY and start_at is 10 years in the past", () => {
    it("should estimate roughly 120 iterations", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.MONTHLY,
      })
      expect(result).toBeGreaterThan(115)
      expect(result).toBeLessThan(125)
    })
  })

  describe("when the rule is YEARLY and start_at is 100 years in the past", () => {
    it("should estimate roughly 100 iterations", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.YEARLY,
      })
      expect(result).toBeGreaterThan(99)
      expect(result).toBeLessThan(101)
    })
  })

  describe("when recurrent_interval is 0 (coerced to 1)", () => {
    it("should treat interval as 1", () => {
      const result = estimateRecurrentPastIterations({
        ...baseOptions,
        start_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        recurrent_frequency: Frequency.DAILY,
        recurrent_interval: 0,
      })
      expect(result).toBeGreaterThan(360)
      expect(result).toBeLessThan(370)
    })
  })
})

test(`minutesOfDay`, () => {
  expect(minutesOfDay(new Date("2026-07-08T00:00:00.000Z"))).toBe(0)
  expect(minutesOfDay(new Date("2026-07-08T14:00:00.000Z"))).toBe(14 * 60)
  expect(minutesOfDay(new Date("2026-07-08T23:59:00.000Z"))).toBe(23 * 60 + 59)
})

test(`applyTimeOfDay`, () => {
  const date = new Date("2026-07-08T03:15:20.500Z")
  const result = applyTimeOfDay(date, 20 * 60, 45, 250)
  expect(result.toISOString()).toBe("2026-07-08T20:00:45.250Z")
  expect(date.toISOString()).toBe("2026-07-08T03:15:20.500Z") // no mutation
})

test(`normalizeTimeSlots without input derives a single slot from start_at/duration`, () => {
  const start_at = new Date("2026-07-08T14:00:00.000Z")
  expect(normalizeTimeSlots(undefined, start_at, 3600000)).toEqual([
    { time: 14 * 60, duration: 3600000 },
  ])
  expect(normalizeTimeSlots([], start_at, 3600000)).toEqual([
    { time: 14 * 60, duration: 3600000 },
  ])
})

test(`normalizeTimeSlots sorts provided slots by time ascending`, () => {
  const start_at = new Date("2026-07-08T14:00:00.000Z")
  const result = normalizeTimeSlots(
    [
      { time: 20 * 60, duration: 1000 },
      { time: 14 * 60, duration: 2000 },
    ],
    start_at,
    9999
  )
  expect(result).toEqual([
    { time: 14 * 60, duration: 2000 },
    { time: 20 * 60, duration: 1000 },
  ])
})

test(`datesForDay produces one date per slot, sorted, on the same calendar day`, () => {
  const day = new Date("2026-07-08T14:00:30.123Z")
  const time_slots: EventTimeSlot[] = [
    { time: 20 * 60, duration: 1000 },
    { time: 14 * 60, duration: 2000 },
  ]
  const result = datesForDay(day, time_slots, 30, 123)
  expect(result.map((d) => d.toISOString())).toEqual([
    "2026-07-08T14:00:30.123Z",
    "2026-07-08T20:00:30.123Z",
  ])
})

test(`slotForDate finds the slot matching the date's time-of-day, falls back to the first`, () => {
  const time_slots: EventTimeSlot[] = [
    { time: 14 * 60, duration: 1000 },
    { time: 20 * 60, duration: 2000 },
  ]
  expect(slotForDate(new Date("2026-07-08T20:00:00.000Z"), time_slots)).toEqual(
    { time: 20 * 60, duration: 2000 }
  )
  expect(slotForDate(new Date("2026-07-08T09:00:00.000Z"), time_slots)).toEqual(
    { time: 14 * 60, duration: 1000 }
  )
})

test(`finishForDate adds the matching slot's duration`, () => {
  const time_slots: EventTimeSlot[] = [
    { time: 14 * 60, duration: 1000 },
    { time: 20 * 60, duration: 2000 },
  ]
  const date = new Date("2026-07-08T20:00:00.000Z")
  expect(finishForDate(date, time_slots).getTime()).toBe(date.getTime() + 2000)
})

test(`validateTimeSlots accepts valid single and multi slots`, () => {
  expect(() =>
    validateTimeSlots([{ time: 840, duration: 3600000 }], null)
  ).not.toThrow()
  expect(() =>
    validateTimeSlots(
      [
        { time: 840, duration: 3600000 },
        { time: 1200, duration: 7200000 },
      ],
      Frequency.WEEKLY
    )
  ).not.toThrow()
})

test(`validateTimeSlots rejects an empty list`, () => {
  expect(() => validateTimeSlots([], null)).toThrow()
})

test(`validateTimeSlots rejects more than MAX_EVENT_TIME_SLOTS`, () => {
  const slots = Array.from({ length: MAX_EVENT_TIME_SLOTS + 1 }, (_, i) => ({
    time: i * 10,
    duration: 1000,
  }))
  expect(() => validateTimeSlots(slots, null)).toThrow()
})

test(`validateTimeSlots rejects multiple slots combined with HOURLY recurrence`, () => {
  expect(() =>
    validateTimeSlots(
      [
        { time: 0, duration: 1000 },
        { time: 30, duration: 1000 },
      ],
      Frequency.HOURLY
    )
  ).toThrow()
})

test(`validateTimeSlots rejects duplicated times`, () => {
  expect(() =>
    validateTimeSlots(
      [
        { time: 840, duration: 1000 },
        { time: 840, duration: 2000 },
      ],
      null
    )
  ).toThrow()
})

test(`validateTimeSlots rejects a negative or over-cap duration but allows zero (legacy)`, () => {
  expect(() => validateTimeSlots([{ time: 840, duration: -1 }], null)).toThrow()
  expect(() =>
    validateTimeSlots([{ time: 840, duration: MAX_EVENT_DURATION + 1 }], null)
  ).toThrow()
  expect(() =>
    validateTimeSlots([{ time: 840, duration: 0 }], null)
  ).not.toThrow()
})

test(`validateTimeSlots accepts a raised max_duration for grandfathered rows`, () => {
  const grandfathered = MAX_EVENT_DURATION * 2
  expect(() =>
    validateTimeSlots([{ time: 840, duration: grandfathered }], null)
  ).toThrow()
  expect(() =>
    validateTimeSlots(
      [{ time: 840, duration: grandfathered }],
      null,
      grandfathered
    )
  ).not.toThrow()
  expect(() =>
    validateTimeSlots(
      [{ time: 840, duration: grandfathered + 1 }],
      null,
      grandfathered
    )
  ).toThrow()
})

describe("futureRecurrentDates with multiple time slots", () => {
  it("expands each recurrence day into one date per time slot", () => {
    const dates = futureRecurrentDates({
      start_at: new Date("2020-01-01T14:00:00.000Z"), // a past Wednesday
      duration: 3600000,
      time_slots: [
        { time: 14 * 60, duration: 3600000 },
        { time: 20 * 60, duration: 3600000 },
      ],
      recurrent: true,
      recurrent_frequency: Frequency.WEEKLY,
      recurrent_interval: 1,
      recurrent_setpos: null,
      recurrent_monthday: null,
      recurrent_weekday_mask: 0,
      recurrent_month_mask: 0,
      recurrent_until: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      recurrent_count: null,
    })

    expect(dates.length).toBeGreaterThan(1)
    expect(dates.length % 2).toBe(0) // always pairs of (14:00, 20:00)
    for (let i = 0; i < dates.length; i += 2) {
      expect(dates[i].getUTCHours()).toBe(14)
      expect(dates[i + 1].getUTCHours()).toBe(20)
      expect(dates[i].getUTCFullYear()).toBe(dates[i + 1].getUTCFullYear())
      expect(dates[i].getUTCMonth()).toBe(dates[i + 1].getUTCMonth())
      expect(dates[i].getUTCDate()).toBe(dates[i + 1].getUTCDate())
    }
  })

  it("caps materialized occurrences at MAX_EVENT_RECURRENT distinct days", () => {
    const now = Date.now()
    // Both slots later today so the >= now filter drops nothing and
    // the +1 day compensation would otherwise leave 11 days.
    const slotA = new Date(now + 60 * 60 * 1000)
    const slotB = new Date(now + 2 * 60 * 60 * 1000)

    const dates = futureRecurrentDates({
      start_at: slotA,
      duration: 3600000,
      time_slots: [
        { time: minutesOfDay(slotA), duration: 3600000 },
        { time: minutesOfDay(slotB), duration: 3600000 },
      ],
      recurrent: true,
      recurrent_frequency: Frequency.DAILY,
      recurrent_interval: 1,
      recurrent_setpos: null,
      recurrent_monthday: null,
      recurrent_weekday_mask: 0,
      recurrent_month_mask: 0,
      recurrent_until: new Date(now + 365 * 24 * 60 * 60 * 1000),
      recurrent_count: null,
    })

    const distinctDays = new Set(
      dates.map((date) => date.toISOString().slice(0, 10))
    )
    expect(distinctDays.size).toBe(MAX_EVENT_RECURRENT)
    expect(dates.length).toBe(MAX_EVENT_RECURRENT * 2)
  })

  it("surfaces today's later slot even after the earlier slot already passed", () => {
    const now = Date.now()
    const passedSlotTime = new Date(now - 30 * 60 * 1000) // 30 min ago
    const upcomingSlotTime = new Date(now + 30 * 60 * 1000) // in 30 min

    const dates = futureRecurrentDates({
      start_at: passedSlotTime,
      duration: 3600000,
      time_slots: [
        { time: minutesOfDay(passedSlotTime), duration: 3600000 },
        { time: minutesOfDay(upcomingSlotTime), duration: 3600000 },
      ],
      recurrent: true,
      recurrent_frequency: Frequency.DAILY,
      recurrent_interval: 1,
      recurrent_setpos: null,
      recurrent_monthday: null,
      recurrent_weekday_mask: 0,
      recurrent_month_mask: 0,
      recurrent_until: new Date(now + 365 * 24 * 60 * 60 * 1000),
      recurrent_count: null,
    })

    expect(dates.length).toBeGreaterThan(0)
    expect(dates[0].getTime()).toBeGreaterThanOrEqual(now)
    expect(dates[0].getUTCHours()).toBe(upcomingSlotTime.getUTCHours())
    expect(dates[0].getUTCMinutes()).toBe(upcomingSlotTime.getUTCMinutes())
  })
})

describe("calculateRecurrentProperties", () => {
  it("is byte-for-byte unchanged for legacy single-slot input", () => {
    const start_at = new Date("2026-07-08T14:00:00.000Z")
    const result = calculateRecurrentProperties({
      start_at,
      duration: 3600000,
      finish_at: new Date(start_at.getTime() + 3600000),
    })

    expect(result.start_at.toISOString()).toBe("2026-07-08T14:00:00.000Z")
    expect(result.duration).toBe(3600000)
    expect(result.time_slots).toEqual([{ time: 14 * 60, duration: 3600000 }])
    expect(result.recurrent_dates.map((d) => d.toISOString())).toEqual([
      "2026-07-08T14:00:00.000Z",
    ])
    expect(result.finish_at.toISOString()).toBe("2026-07-08T15:00:00.000Z")
  })

  it("materializes all slots for a non-recurrent multi-slot event and normalizes start_at to the earliest slot", () => {
    const start_at = new Date("2026-07-08T20:00:00.000Z") // deliberately the LATER slot
    const result = calculateRecurrentProperties({
      start_at,
      duration: 3600000,
      finish_at: new Date(start_at.getTime() + 3600000),
      time_slots: [
        { time: 20 * 60, duration: 3600000 }, // 20:00, 1h
        { time: 14 * 60, duration: 10800000 }, // 14:00, 3h
      ],
    })

    expect(result.start_at.toISOString()).toBe("2026-07-08T14:00:00.000Z")
    expect(result.duration).toBe(10800000)
    expect(result.time_slots).toEqual([
      { time: 14 * 60, duration: 10800000 },
      { time: 20 * 60, duration: 3600000 },
    ])
    expect(result.recurrent_dates.map((d) => d.toISOString())).toEqual([
      "2026-07-08T14:00:00.000Z",
      "2026-07-08T20:00:00.000Z",
    ])
    expect(result.finish_at.toISOString()).toBe("2026-07-08T21:00:00.000Z")
  })

  it("reconciles start_at/duration with a single explicitly-provided slot", () => {
    // Client sends start_at at 14:00 but declares the (only) showing
    // at 20:00 with a different duration — the slot is the source of
    // truth, so start_at/duration/finish_at must follow it.
    const start_at = new Date("2026-07-10T14:00:00.000Z")
    const result = calculateRecurrentProperties({
      start_at,
      duration: 3600000,
      finish_at: new Date(start_at.getTime() + 3600000),
      time_slots: [{ time: 20 * 60, duration: 7200000 }],
    })

    expect(result.start_at.toISOString()).toBe("2026-07-10T20:00:00.000Z")
    expect(result.duration).toBe(7200000)
    expect(result.recurrent_dates.map((d) => d.toISOString())).toEqual([
      "2026-07-10T20:00:00.000Z",
    ])
    expect(result.finish_at.toISOString()).toBe("2026-07-10T22:00:00.000Z")
  })

  it("handles a recurrent multi-slot event end-to-end", () => {
    const start_at = new Date("2020-01-01T14:00:00.000Z")
    const result = calculateRecurrentProperties({
      start_at,
      duration: 3600000,
      finish_at: new Date(start_at.getTime() + 3600000),
      time_slots: [
        { time: 14 * 60, duration: 3600000 },
        { time: 20 * 60, duration: 3600000 },
      ],
      recurrent: true,
      recurrent_frequency: Frequency.WEEKLY,
      recurrent_interval: 1,
      recurrent_until: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
    } as any)

    expect(result.recurrent_dates.length).toBeGreaterThan(0)
    expect(result.recurrent_dates.length % 2).toBe(0)
    const last = result.recurrent_dates[result.recurrent_dates.length - 1]
    expect(result.finish_at.getTime()).toBe(last.getTime() + 3600000)
  })
})

describe("calculateNextRecurrentDates", () => {
  it("keeps next_start_at while its own slot is still live", () => {
    const now = Date.now()
    const start_at = new Date(now - 30 * 60 * 1000)
    const time_slots: EventTimeSlot[] = [
      { time: minutesOfDay(start_at), duration: 3600000 },
    ]

    const result = calculateNextRecurrentDates({
      start_at,
      time_slots,
      recurrent_dates: [start_at],
    } as any)

    expect(result.next_start_at).toBe(start_at)
    expect(result.next_finish_at.getTime()).toBe(start_at.getTime() + 3600000)
  })

  it("advances to the next recurrent_dates entry once the current slot finished", () => {
    const now = Date.now()
    const finished = new Date(now - 2 * 3600000)
    const upcoming = new Date(now + 3600000)
    const time_slots: EventTimeSlot[] = [
      { time: minutesOfDay(finished), duration: 3600000 },
    ]

    const result = calculateNextRecurrentDates({
      start_at: finished,
      time_slots,
      recurrent_dates: [finished, upcoming],
    } as any)

    expect(result.next_start_at).toBe(upcoming)
  })
})
