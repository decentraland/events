import EventModel from "./model"
import {
  DeprecatedEventAttributes,
  EventAttributes,
  EventListOptions,
  EventListType,
  SessionEventAttributes,
} from "./types"
import { ProfileSettingsAttributes } from "../ProfileSettings/types"

const TO_PUBLIC_USER = "0x1111111111111111111111111111111111111111"

function createEvent(
  overrides: Partial<DeprecatedEventAttributes> = {}
): DeprecatedEventAttributes {
  const startAt = new Date("2030-01-01T00:00:00Z")
  return {
    user: TO_PUBLIC_USER,
    user_name: "Creator",
    description: "Original description",
    contact: null,
    details: null,
    estate_name: "Estate",
    scene_name: null,
    x: 10,
    y: 20,
    duration: 3600000,
    next_start_at: startAt,
    recurrent_dates: [startAt],
    ...overrides,
  } as unknown as DeprecatedEventAttributes
}

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

describe("EventModel.toPublic", () => {
  let profile: ProfileSettingsAttributes

  beforeEach(() => {
    profile = { user: TO_PUBLIC_USER } as ProfileSettingsAttributes
  })

  describe("when the event description contains client-rendered markup", () => {
    let result: SessionEventAttributes

    beforeEach(() => {
      const event = createEvent({
        description:
          'Join <link="decentraland://?position=0,0">click here</link>',
      })
      result = EventModel.toPublic(event, profile)
    })

    it("should strip the markup from the returned description", () => {
      expect(result.description).toBe("Join click here")
    })
  })

  describe("when the event description contains markdown", () => {
    let result: SessionEventAttributes

    beforeEach(() => {
      const event = createEvent({
        description: "See [our site](https://decentraland.org) for **details**",
      })
      result = EventModel.toPublic(event, profile)
    })

    it("should leave the markdown untouched", () => {
      expect(result.description).toBe(
        "See [our site](https://decentraland.org) for **details**"
      )
    })
  })
})

describe("EventModel.getEvents ordering", () => {
  let namedQuerySpy: jest.SpyInstance

  function createMockEventRow(
    overrides: Partial<EventAttributes> = {}
  ): EventAttributes {
    const startAt = new Date("2030-01-01T00:00:00Z")
    return {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Test Event",
      image: null,
      image_vertical: null,
      description: "desc",
      start_at: startAt,
      finish_at: new Date("2030-01-01T01:00:00Z"),
      next_start_at: startAt,
      next_finish_at: new Date("2030-01-01T01:00:00Z"),
      duration: 3600000,
      all_day: false,
      x: 0,
      y: 0,
      server: null,
      url: "",
      user: "0x0000000000000000000000000000000000000000",
      estate_id: null,
      estate_name: null,
      user_name: null,
      approved: true,
      rejected: false,
      highlighted: false,
      trending: false,
      created_at: new Date(),
      updated_at: new Date(),
      recurrent: false,
      recurrent_frequency: null,
      recurrent_setpos: null,
      recurrent_monthday: null,
      recurrent_weekday_mask: 0,
      recurrent_month_mask: 0,
      recurrent_interval: 1,
      recurrent_count: null,
      recurrent_until: null,
      recurrent_dates: [startAt],
      contact: null,
      details: null,
      total_attendees: 0,
      latest_attendees: [],
      textsearch: null,
      categories: [],
      schedules: [],
      approved_by: null,
      rejected_by: null,
      rejection_reason: null,
      deleted_by_user: false,
      deleted_by_admin: false,
      deleted_by: null,
      deleted_at: null,
      deleted_reason: null,
      world: false,
      place_id: null,
      community_id: null,
      ...overrides,
    } satisfies EventAttributes
  }

  beforeEach(() => {
    namedQuerySpy = jest.spyOn(EventModel, "namedQuery")
  })

  afterEach(() => {
    namedQuerySpy.mockRestore()
  })

  it("should include e.id ASC tiebreaker in the ORDER BY clause", async () => {
    namedQuerySpy.mockResolvedValue([])
    await EventModel.getEvents({ list: EventListType.Active })

    const sql = namedQuerySpy.mock.calls[0][1].text
    expect(sql).toMatch(/ORDER BY\s+e\.next_start_at\s+ASC\s*,\s*e\.id\s+ASC/i)
  })

  it("should include e.id ASC tiebreaker when searching by rank", async () => {
    namedQuerySpy.mockResolvedValue([])
    await EventModel.getEvents({
      list: EventListType.Active,
      search: "test event",
    })

    const sql = namedQuerySpy.mock.calls[0][1].text
    expect(sql).toMatch(/ORDER BY\s+"rank"\s+DESC\s*,\s*e\.id\s+ASC/i)
  })

  it("should include e.id ASC tiebreaker with explicit desc order", async () => {
    namedQuerySpy.mockResolvedValue([])
    await EventModel.getEvents({
      list: EventListType.Active,
      order: "desc",
    })

    const sql = namedQuerySpy.mock.calls[0][1].text
    expect(sql).toMatch(/ORDER BY\s+e\.next_start_at\s+DESC\s*,\s*e\.id\s+ASC/i)
  })

  it("should return events sorted by next_start_at ascending", async () => {
    const early = createMockEventRow({
      id: "00000000-0000-0000-0000-000000000002",
      name: "Early Event",
      next_start_at: new Date("2030-01-01T10:00:00Z"),
      start_at: new Date("2030-01-01T10:00:00Z"),
      finish_at: new Date("2030-01-01T11:00:00Z"),
      next_finish_at: new Date("2030-01-01T11:00:00Z"),
      recurrent_dates: [new Date("2030-01-01T10:00:00Z")],
    })
    const mid = createMockEventRow({
      id: "00000000-0000-0000-0000-000000000003",
      name: "Mid Event",
      next_start_at: new Date("2030-01-02T10:00:00Z"),
      start_at: new Date("2030-01-02T10:00:00Z"),
      finish_at: new Date("2030-01-02T11:00:00Z"),
      next_finish_at: new Date("2030-01-02T11:00:00Z"),
      recurrent_dates: [new Date("2030-01-02T10:00:00Z")],
    })
    const late = createMockEventRow({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Late Event",
      next_start_at: new Date("2030-01-03T10:00:00Z"),
      start_at: new Date("2030-01-03T10:00:00Z"),
      finish_at: new Date("2030-01-03T11:00:00Z"),
      next_finish_at: new Date("2030-01-03T11:00:00Z"),
      recurrent_dates: [new Date("2030-01-03T10:00:00Z")],
    })

    namedQuerySpy.mockResolvedValue([early, mid, late])
    const results = await EventModel.getEvents({ list: EventListType.Active })

    expect(results.map((e) => e.name)).toEqual([
      "Early Event",
      "Mid Event",
      "Late Event",
    ])
  })

  it("should use id as tiebreaker when events share the same next_start_at", async () => {
    const sameStartAt = new Date("2030-06-15T18:00:00Z")
    const sameFinishAt = new Date("2030-06-15T19:00:00Z")

    const eventA = createMockEventRow({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Event A (first by id)",
      next_start_at: sameStartAt,
      start_at: sameStartAt,
      finish_at: sameFinishAt,
      next_finish_at: sameFinishAt,
      recurrent_dates: [sameStartAt],
    })
    const eventB = createMockEventRow({
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Event B (second by id)",
      next_start_at: sameStartAt,
      start_at: sameStartAt,
      finish_at: sameFinishAt,
      next_finish_at: sameFinishAt,
      recurrent_dates: [sameStartAt],
    })
    const eventC = createMockEventRow({
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Event C (third by id)",
      next_start_at: sameStartAt,
      start_at: sameStartAt,
      finish_at: sameFinishAt,
      next_finish_at: sameFinishAt,
      recurrent_dates: [sameStartAt],
    })

    namedQuerySpy.mockResolvedValue([eventA, eventB, eventC])
    const results = await EventModel.getEvents({ list: EventListType.Active })

    expect(results.map((e) => e.id)).toEqual([
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
    ])
    expect(results.map((e) => e.name)).toEqual([
      "Event A (first by id)",
      "Event B (second by id)",
      "Event C (third by id)",
    ])
  })

  it("should order by next_start_at first then by id within same start time", async () => {
    const earlyStart = new Date("2030-03-01T10:00:00Z")
    const lateStart = new Date("2030-03-02T10:00:00Z")

    const earlyA = createMockEventRow({
      id: "22222222-2222-2222-2222-222222222222",
      name: "Early - second by id",
      next_start_at: earlyStart,
      start_at: earlyStart,
      finish_at: new Date("2030-03-01T11:00:00Z"),
      next_finish_at: new Date("2030-03-01T11:00:00Z"),
      recurrent_dates: [earlyStart],
    })
    const earlyB = createMockEventRow({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Early - first by id",
      next_start_at: earlyStart,
      start_at: earlyStart,
      finish_at: new Date("2030-03-01T11:00:00Z"),
      next_finish_at: new Date("2030-03-01T11:00:00Z"),
      recurrent_dates: [earlyStart],
    })
    const lateC = createMockEventRow({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Late - only event",
      next_start_at: lateStart,
      start_at: lateStart,
      finish_at: new Date("2030-03-02T11:00:00Z"),
      next_finish_at: new Date("2030-03-02T11:00:00Z"),
      recurrent_dates: [lateStart],
    })

    namedQuerySpy.mockResolvedValue([earlyB, earlyA, lateC])
    const results = await EventModel.getEvents({ list: EventListType.Active })

    expect(results.map((e) => e.name)).toEqual([
      "Early - first by id",
      "Early - second by id",
      "Late - only event",
    ])
  })

  it("should preserve deterministic order across repeated calls", async () => {
    const sameStartAt = new Date("2030-06-15T18:00:00Z")
    const sameFinishAt = new Date("2030-06-15T19:00:00Z")

    const events = [
      createMockEventRow({
        id: "aaaaaaaa-0000-0000-0000-000000000001",
        name: "Alpha",
        next_start_at: sameStartAt,
        start_at: sameStartAt,
        finish_at: sameFinishAt,
        next_finish_at: sameFinishAt,
        recurrent_dates: [sameStartAt],
      }),
      createMockEventRow({
        id: "aaaaaaaa-0000-0000-0000-000000000002",
        name: "Beta",
        next_start_at: sameStartAt,
        start_at: sameStartAt,
        finish_at: sameFinishAt,
        next_finish_at: sameFinishAt,
        recurrent_dates: [sameStartAt],
      }),
      createMockEventRow({
        id: "aaaaaaaa-0000-0000-0000-000000000003",
        name: "Gamma",
        next_start_at: sameStartAt,
        start_at: sameStartAt,
        finish_at: sameFinishAt,
        next_finish_at: sameFinishAt,
        recurrent_dates: [sameStartAt],
      }),
    ]

    namedQuerySpy.mockResolvedValue(events)
    const first = await EventModel.getEvents({ list: EventListType.Active })

    namedQuerySpy.mockResolvedValue(events)
    const second = await EventModel.getEvents({ list: EventListType.Active })

    expect(first.map((e) => e.id)).toEqual(second.map((e) => e.id))
    expect(first.map((e) => e.name)).toEqual(["Alpha", "Beta", "Gamma"])
  })
})
