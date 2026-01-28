import EventModel from "./model"
import { EventListOptions, EventListType } from "./types"

type SQLCondition = { text: string }

const ATTENDEE_FILTER_REGEX = /a\.user\s+IS\s+NOT\s+NULL/i

const buildEventFilterConditions = (
  EventModel as any
).buildEventFilterConditions.bind(EventModel) as (
  options: Partial<EventListOptions>
) => SQLCondition[]

function hasAttendeeFilterCondition(conditions: SQLCondition[]): boolean {
  return conditions.some((condition) =>
    ATTENDEE_FILTER_REGEX.test(condition.text)
  )
}

describe("EventModel.buildEventFilterConditions", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when only_attendee option is true", () => {
    let options: Partial<EventListOptions>

    beforeEach(() => {
      options = {
        only_attendee: true,
        list: EventListType.Active,
      }
    })

    describe("and user option is provided", () => {
      beforeEach(() => {
        options.user = "0x1234567890abcdef"
      })

      it("generates an attendee filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasAttendeeFilterCondition(conditions)).toBe(true)
      })
    })

    describe("and user option is not provided", () => {
      it("does not generate an attendee filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasAttendeeFilterCondition(conditions)).toBe(false)
      })
    })
  })

  describe("when only_attendee option is false", () => {
    let options: Partial<EventListOptions>

    beforeEach(() => {
      options = {
        only_attendee: false,
        user: "0x1234567890abcdef",
        list: EventListType.Active,
      }
    })

    it("does not generate an attendee filter condition", () => {
      const conditions = buildEventFilterConditions(options)

      expect(hasAttendeeFilterCondition(conditions)).toBe(false)
    })
  })

  describe("when only_attendee option is undefined", () => {
    let options: Partial<EventListOptions>

    beforeEach(() => {
      options = {
        list: EventListType.Active,
      }
    })

    it("does not generate an attendee filter condition", () => {
      const conditions = buildEventFilterConditions(options)

      expect(hasAttendeeFilterCondition(conditions)).toBe(false)
    })
  })

  describe("when date range filters are provided", () => {
    const DATE_RANGE_FROM_REGEX = /e\.next_start_at\s*>=\s*/i
    const DATE_RANGE_TO_REGEX = /e\.next_start_at\s*<\s*/i

    function hasFromCondition(conditions: SQLCondition[]): boolean {
      return conditions.some((condition) =>
        DATE_RANGE_FROM_REGEX.test(condition.text)
      )
    }

    function hasToCondition(conditions: SQLCondition[]): boolean {
      return conditions.some((condition) =>
        DATE_RANGE_TO_REGEX.test(condition.text)
      )
    }

    describe("and from option is provided", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          from: new Date("2026-01-01T00:00:00Z"),
        }
      })

      it("generates a from date filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasFromCondition(conditions)).toBe(true)
      })
    })

    describe("and to option is provided", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          to: new Date("2026-01-31T23:59:59Z"),
        }
      })

      it("generates a to date filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasToCondition(conditions)).toBe(true)
      })
    })

    describe("and both from and to options are provided", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          from: new Date("2026-01-01T00:00:00Z"),
          to: new Date("2026-01-31T23:59:59Z"),
        }
      })

      it("generates both from and to date filter conditions", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasFromCondition(conditions)).toBe(true)
        expect(hasToCondition(conditions)).toBe(true)
      })
    })

    describe("and neither from nor to options are provided", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
        }
      })

      it("does not generate date range filter conditions", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasFromCondition(conditions)).toBe(false)
        expect(hasToCondition(conditions)).toBe(false)
      })
    })
  })
})
