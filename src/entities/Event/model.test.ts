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
})
