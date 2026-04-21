import { Frequency, MAX_EVENT_RECURRENT } from "./types"
import {
  estimateRecurrentPastIterations,
  fromEventTime,
  futureRecurrentDates,
  toEventTime,
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
