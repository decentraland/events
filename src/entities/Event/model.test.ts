import EventModel, { serializeTimeSlotsForStorage } from "./model"
import { EventListOptions, EventListType } from "./types"

type SQLCondition = { text: string }

const ATTENDEE_FILTER_REGEX = /a\.user\s+IS\s+NOT\s+NULL/i
const REJECTED_FILTER_REGEX = /e\.rejected\s+IS\s+(TRUE|FALSE)/i
const DELETED_FILTER_REGEX =
  /e\.deleted_by_user\s+IS\s+FALSE\s+AND\s+e\.deleted_by_admin\s+IS\s+FALSE/i
const DELETED_INCLUDED_REGEX =
  /e\.deleted_by_user\s+IS\s+TRUE\s+OR\s+e\.deleted_by_admin\s+IS\s+TRUE/i

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

function hasRejectedFilterCondition(conditions: SQLCondition[]): boolean {
  return conditions.some((condition) =>
    REJECTED_FILTER_REGEX.test(condition.text)
  )
}

function hasDeletedExclusionCondition(conditions: SQLCondition[]): boolean {
  return conditions.some((condition) =>
    DELETED_FILTER_REGEX.test(condition.text)
  )
}

function hasDeletedInclusionCondition(conditions: SQLCondition[]): boolean {
  return conditions.some((condition) =>
    DELETED_INCLUDED_REGEX.test(condition.text)
  )
}

describe("EventModel.buildEventFilterConditions", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when rejection filtering is not configured", () => {
    let options: Partial<EventListOptions>

    beforeEach(() => {
      options = {
        list: EventListType.All,
      }
    })

    it("should filter out rejected events by default", () => {
      const conditions = buildEventFilterConditions(options)

      expect(hasRejectedFilterCondition(conditions)).toBe(true)
    })
  })

  describe("when include_rejected option is true", () => {
    let options: Partial<EventListOptions>

    beforeEach(() => {
      options = {
        include_rejected: true,
        list: EventListType.All,
      }
    })

    it("should not generate a rejected filter condition", () => {
      const conditions = buildEventFilterConditions(options)

      expect(hasRejectedFilterCondition(conditions)).toBe(false)
    })
  })

  describe("when rejected option is true", () => {
    let options: Partial<EventListOptions>

    beforeEach(() => {
      options = {
        rejected: true,
        list: EventListType.All,
      }
    })

    it("should generate a rejected filter condition", () => {
      const conditions = buildEventFilterConditions(options)

      expect(hasRejectedFilterCondition(conditions)).toBe(true)
    })
  })

  describe("deleted (soft-delete) filtering", () => {
    it("excludes deleted events by default", () => {
      const conditions = buildEventFilterConditions({ list: EventListType.All })

      expect(hasDeletedExclusionCondition(conditions)).toBe(true)
    })

    it("excludes deleted events even for the owner listing", () => {
      const conditions = buildEventFilterConditions({
        owner: true,
        user: "0x1111111111111111111111111111111111111111",
        list: EventListType.All,
      })

      expect(hasDeletedExclusionCondition(conditions)).toBe(true)
    })

    it("does not exclude deleted events when include_deleted is true", () => {
      const conditions = buildEventFilterConditions({
        include_deleted: true,
        list: EventListType.All,
      })

      expect(hasDeletedExclusionCondition(conditions)).toBe(false)
    })

    it("includes only deleted events when deleted option is true", () => {
      const conditions = buildEventFilterConditions({
        deleted: true,
        list: EventListType.All,
      })

      expect(hasDeletedInclusionCondition(conditions)).toBe(true)
      expect(hasDeletedExclusionCondition(conditions)).toBe(false)
    })
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

  describe("when highlighted option is provided", () => {
    const HIGHLIGHTED_FILTER_REGEX = /e\.highlighted\s+IS\s+TRUE/i

    function hasHighlightedCondition(conditions: SQLCondition[]): boolean {
      return conditions.some((condition) =>
        HIGHLIGHTED_FILTER_REGEX.test(condition.text)
      )
    }

    it("generates a highlighted filter condition when highlighted is true", () => {
      const conditions = buildEventFilterConditions({ highlighted: true })

      expect(hasHighlightedCondition(conditions)).toBe(true)
    })

    it("does not generate a highlighted filter condition when highlighted is false", () => {
      const conditions = buildEventFilterConditions({ highlighted: false })

      expect(hasHighlightedCondition(conditions)).toBe(false)
    })

    it("does not generate a highlighted filter condition when highlighted is omitted", () => {
      const conditions = buildEventFilterConditions({})

      expect(hasHighlightedCondition(conditions)).toBe(false)
    })

    it("composes with list=upcoming", () => {
      const conditions = buildEventFilterConditions({
        list: EventListType.Upcoming,
        highlighted: true,
      })

      const hasUpcoming = conditions.some((c) =>
        /e\.next_finish_at\s*>\s*now\(\)\s*AND\s*e\.next_start_at\s*>\s*now\(\)/i.test(
          c.text
        )
      )

      expect(hasHighlightedCondition(conditions)).toBe(true)
      expect(hasUpcoming).toBe(true)
    })
  })

  describe("when places_ids option is provided", () => {
    const PLACE_ID_FILTER_REGEX = /e\.place_id\s*=\s*ANY/i
    const COMMUNITY_ID_FILTER_REGEX = /e\.community_id\s*=/i

    function hasPlaceIdCondition(conditions: SQLCondition[]): boolean {
      return conditions.some((condition) =>
        PLACE_ID_FILTER_REGEX.test(condition.text)
      )
    }

    function hasCommunityIdCondition(conditions: SQLCondition[]): boolean {
      return conditions.some((condition) =>
        COMMUNITY_ID_FILTER_REGEX.test(condition.text)
      )
    }

    function hasOrCondition(conditions: SQLCondition[]): boolean {
      return conditions.some(
        (condition) =>
          PLACE_ID_FILTER_REGEX.test(condition.text) &&
          /OR/i.test(condition.text) &&
          COMMUNITY_ID_FILTER_REGEX.test(condition.text)
      )
    }

    describe("and place_ids contain UUID-format IDs", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          places_ids: ["550e8400-e29b-41d4-a716-446655440000"],
        }
      })

      it("should generate a place_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasPlaceIdCondition(conditions)).toBe(true)
      })
    })

    describe("and place_ids contain world-name-format IDs", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          places_ids: ["myworld.dcl.eth"],
        }
      })

      it("should generate a place_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasPlaceIdCondition(conditions)).toBe(true)
      })
    })

    describe("and place_ids contain mixed UUID and world-name IDs", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          places_ids: [
            "550e8400-e29b-41d4-a716-446655440000",
            "myworld.dcl.eth",
          ],
        }
      })

      it("should generate a place_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasPlaceIdCondition(conditions)).toBe(true)
      })
    })

    describe("and community_id is also provided", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          places_ids: ["myworld.dcl.eth"],
          community_id: "550e8400-e29b-41d4-a716-446655440001",
        }
      })

      it("should generate an OR condition combining place_id and community_id", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasOrCondition(conditions)).toBe(true)
      })
    })

    describe("and only community_id is provided without places_ids", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
          community_id: "550e8400-e29b-41d4-a716-446655440001",
        }
      })

      it("should generate only a community_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasCommunityIdCondition(conditions)).toBe(true)
      })

      it("should not generate a place_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasPlaceIdCondition(conditions)).toBe(false)
      })
    })

    describe("and neither places_ids nor community_id are provided", () => {
      let options: Partial<EventListOptions>

      beforeEach(() => {
        options = {
          list: EventListType.Active,
        }
      })

      it("should not generate a place_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasPlaceIdCondition(conditions)).toBe(false)
      })

      it("should not generate a community_id filter condition", () => {
        const conditions = buildEventFilterConditions(options)

        expect(hasCommunityIdCondition(conditions)).toBe(false)
      })
    })
  })
})

describe("serializeTimeSlotsForStorage", () => {
  it("JSON-stringifies time_slots when present", () => {
    const payload = {
      id: "event-1",
      time_slots: [
        { time: 840, duration: 3600000 },
        { time: 1200, duration: 7200000 },
      ],
    }

    expect(serializeTimeSlotsForStorage(payload)).toEqual({
      id: "event-1",
      time_slots: JSON.stringify(payload.time_slots),
    })
  })

  it("passes payloads without time_slots through unchanged", () => {
    const payload = { id: "event-1", name: "Watch Party" }
    expect(serializeTimeSlotsForStorage(payload)).toEqual(payload)
  })
})

describe("EventModel.selectNextStartAt", () => {
  it("keeps next_start_at while its slot is still live", () => {
    const now = Date.now()
    const next_start_at = new Date(now - 10 * 60 * 1000)
    const time_slots = [
      {
        time: next_start_at.getUTCHours() * 60 + next_start_at.getUTCMinutes(),
        duration: 3600000,
      },
    ]

    expect(
      EventModel.selectNextStartAt(time_slots, next_start_at, [next_start_at])
    ).toBe(next_start_at)
  })

  it("advances past a finished occurrence using its own slot duration", () => {
    const now = Date.now()
    const finished = new Date(now - 2 * 3600000)
    const upcoming = new Date(now + 3600000)
    const time_slots = [
      {
        time: finished.getUTCHours() * 60 + finished.getUTCMinutes(),
        duration: 3600000,
      },
      {
        time: upcoming.getUTCHours() * 60 + upcoming.getUTCMinutes(),
        duration: 3600000,
      },
    ]

    expect(
      EventModel.selectNextStartAt(time_slots, finished, [finished, upcoming])
    ).toBe(upcoming)
  })
})

describe("EventModel.build", () => {
  it("keeps recurrent_dates[0] equal to the normalized start_at and defaults time_slots", () => {
    const start_at = new Date("2026-07-08T14:00:00.000Z")
    const built = EventModel.build({
      id: "event-1",
      start_at,
      finish_at: new Date(start_at.getTime() + 3600000),
      duration: 3600000,
      time_slots: [],
      recurrent_dates: [],
      next_start_at: null,
    } as any)

    expect(built!.recurrent_dates[0].getTime()).toBe(start_at.getTime())
    expect(built!.time_slots).toEqual([{ time: 14 * 60, duration: 3600000 }])
  })
})

describe("EventModel.toPublic", () => {
  it("computes live using the matching slot's duration", () => {
    const now = Date.now()
    const next_start_at = new Date(now - 30 * 60 * 1000)
    const time_slots = [
      {
        time: next_start_at.getUTCHours() * 60 + next_start_at.getUTCMinutes(),
        duration: 3600000,
      },
    ]

    const result = EventModel.toPublic(
      {
        id: "event-1",
        user: "0xabc",
        time_slots,
        duration: 3600000,
        next_start_at,
        recurrent_dates: [next_start_at],
      } as any,
      { user: "0xabc" } as any
    )

    expect(result.live).toBe(true)
  })
})
