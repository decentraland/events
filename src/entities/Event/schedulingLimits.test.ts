import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import Time from "decentraland-gatsby/dist/utils/date/Time"

import EventModel from "./model"
import {
  canBypassSchedulingLimits,
  isDailyEvent,
  isSameLocation,
  occurrenceDaysBetween,
  resolveSchedulingPlace,
  validateDailyEventDuration,
  validatePlaceDailyLimit,
} from "./schedulingLimits"
import {
  DeprecatedEventAttributes,
  Frequency,
  RecurrentEventAttributes,
  SchedulingLimitErrorCode,
  WeekdayMask,
} from "./types"
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfilePermissions,
  ProfileSettingsAttributes,
} from "../ProfileSettings/types"

jest.mock("decentraland-gatsby/dist/entities/Auth/isAdmin", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))
jest.mock("./model")

const USER = "0x1111111111111111111111111111111111111111"
const NOW = new Date("2030-01-01T12:00:00Z")

function day(date: string) {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / Time.Day)
}

function profileWith(
  permissions: ProfilePermissions[]
): ProfileSettingsAttributes {
  return {
    ...DEFAULT_PROFILE_SETTINGS,
    user: USER,
    permissions,
  } as ProfileSettingsAttributes
}

function oneOff(
  start_at: string,
  duration = Time.Hour
): RecurrentEventAttributes {
  return {
    start_at: new Date(start_at),
    duration,
    recurrent: false,
    recurrent_interval: 1,
    recurrent_frequency: null,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_until: null,
    recurrent_count: null,
  }
}

function daily(
  start_at: string,
  recurrent_until: string,
  duration = Time.Hour
): RecurrentEventAttributes {
  return {
    ...oneOff(start_at, duration),
    recurrent: true,
    recurrent_frequency: Frequency.DAILY,
    recurrent_until: new Date(recurrent_until),
  }
}

function weekly(
  start_at: string,
  recurrent_until: string,
  duration = Time.Hour
): RecurrentEventAttributes {
  return {
    ...daily(start_at, recurrent_until, duration),
    recurrent_frequency: Frequency.WEEKLY,
  }
}

function stored(event: RecurrentEventAttributes) {
  return event as unknown as DeprecatedEventAttributes
}

const LAND_PLACE = resolveSchedulingPlace(
  { world: false, server: null, x: 50, y: 50 },
  { positions: ["50,50", "51,50"] }
)

describe("canBypassSchedulingLimits", () => {
  afterEach(() => {
    ;(isAdmin as jest.Mock).mockReturnValue(false)
  })

  describe("when the user is a creator with no permissions", () => {
    it("should not bypass the limits", () => {
      expect(canBypassSchedulingLimits(USER, profileWith([]))).toBe(false)
    })
  })

  describe("when the user can only approve their own events", () => {
    it("should not bypass the limits", () => {
      expect(
        canBypassSchedulingLimits(
          USER,
          profileWith([ProfilePermissions.ApproveOwnEvent])
        )
      ).toBe(false)
    })
  })

  describe("when the user can approve any event", () => {
    it("should bypass the limits", () => {
      expect(
        canBypassSchedulingLimits(
          USER,
          profileWith([ProfilePermissions.ApproveAnyEvent])
        )
      ).toBe(true)
    })
  })

  describe("when the user can edit any event", () => {
    it("should bypass the limits", () => {
      expect(
        canBypassSchedulingLimits(
          USER,
          profileWith([ProfilePermissions.EditAnyEvent])
        )
      ).toBe(true)
    })
  })

  describe("when the user is an admin wallet", () => {
    beforeEach(() => {
      ;(isAdmin as jest.Mock).mockReturnValue(true)
    })

    it("should bypass the limits", () => {
      expect(canBypassSchedulingLimits(USER, profileWith([]))).toBe(true)
    })
  })
})

describe("isDailyEvent", () => {
  describe("when the event does not repeat", () => {
    it("should return false", () => {
      expect(
        isDailyEvent({
          recurrent: false,
          recurrent_frequency: Frequency.DAILY,
          recurrent_dates: [],
        })
      ).toBe(false)
    })
  })

  describe("when the event repeats daily", () => {
    it("should return true", () => {
      expect(
        isDailyEvent({
          recurrent: true,
          recurrent_frequency: Frequency.DAILY,
          recurrent_dates: [],
        })
      ).toBe(true)
    })
  })

  describe("when the event repeats hourly", () => {
    it("should return true", () => {
      expect(
        isDailyEvent({
          recurrent: true,
          recurrent_frequency: Frequency.HOURLY,
          recurrent_dates: [],
        })
      ).toBe(true)
    })
  })

  describe("when a weekly event lands on back-to-back days", () => {
    it("should return true", () => {
      expect(
        isDailyEvent({
          recurrent: true,
          recurrent_frequency: Frequency.WEEKLY,
          recurrent_dates: [
            new Date("2030-01-07T10:00:00Z"),
            new Date("2030-01-08T10:00:00Z"),
          ],
        })
      ).toBe(true)
    })
  })

  describe("when a weekly event repeats once a week", () => {
    it("should return false", () => {
      expect(
        isDailyEvent({
          recurrent: true,
          recurrent_frequency: Frequency.WEEKLY,
          recurrent_dates: [
            new Date("2030-01-07T10:00:00Z"),
            new Date("2030-01-14T10:00:00Z"),
          ],
        })
      ).toBe(false)
    })
  })
})

describe("validateDailyEventDuration", () => {
  const dailyRecurrence = {
    recurrent: true,
    recurrent_frequency: Frequency.DAILY,
    recurrent_dates: [],
  }

  describe("when a daily event lasts 2 hours", () => {
    it("should accept it", () => {
      expect(() =>
        validateDailyEventDuration(
          { ...dailyRecurrence, duration: 2 * Time.Hour },
          {}
        )
      ).not.toThrow()
    })
  })

  describe("when a daily event lasts more than 2 hours", () => {
    it("should reject it with the daily_event_too_long code", () => {
      expect.assertions(2)
      try {
        validateDailyEventDuration(
          { ...dailyRecurrence, duration: 24 * Time.Hour },
          {}
        )
      } catch (error: any) {
        expect(error.message).toMatch(/Daily events can last up to 2 hours/)
        expect(error.code).toBe(SchedulingLimitErrorCode.DailyEventTooLong)
      }
    })
  })

  describe("when a weekly event lasts 24 hours", () => {
    it("should accept it", () => {
      expect(() =>
        validateDailyEventDuration(
          {
            recurrent: true,
            recurrent_frequency: Frequency.WEEKLY,
            recurrent_dates: [],
            duration: 24 * Time.Hour,
          },
          {}
        )
      ).not.toThrow()
    })
  })

  describe("when a one-off event lasts 24 hours", () => {
    it("should accept it", () => {
      expect(() =>
        validateDailyEventDuration(
          {
            recurrent: false,
            recurrent_frequency: null,
            recurrent_dates: [],
            duration: 24 * Time.Hour,
          },
          {}
        )
      ).not.toThrow()
    })
  })
})

describe("resolveSchedulingPlace", () => {
  describe("when the event is in a World", () => {
    it("should key the place by the lowercased World name", () => {
      expect(
        resolveSchedulingPlace(
          { world: true, server: "MyWorld.dcl.eth", x: 0, y: 0 },
          null
        )
      ).toEqual({ world: true, name: "myworld.dcl.eth" })
    })
  })

  describe("when the Places API knows the scene", () => {
    it("should use every parcel of the scene", () => {
      expect(LAND_PLACE).toEqual({
        world: false,
        positions: [
          [50, 50],
          [51, 50],
        ],
        genesisPlaza: false,
      })
    })
  })

  describe("when the Places API has no scene at the parcel", () => {
    it("should use the event's own parcel", () => {
      expect(
        resolveSchedulingPlace(
          { world: false, server: null, x: 7, y: -3 },
          null
        )
      ).toEqual({ world: false, positions: [[7, -3]], genesisPlaza: false })
    })
  })

  describe("when the scene contains parcel 0,0", () => {
    it("should flag it as Genesis Plaza", () => {
      expect(
        resolveSchedulingPlace(
          { world: false, server: null, x: 2, y: 5 },
          { positions: ["0,0", "2,5"] }
        )
      ).toMatchObject({ world: false, genesisPlaza: true })
    })
  })

  describe("when a World event is flagged world without a World name", () => {
    it("should treat it as a Genesis City event", () => {
      expect(
        resolveSchedulingPlace({ world: true, server: null, x: 7, y: 7 }, null)
      ).toEqual({ world: false, positions: [[7, 7]], genesisPlaza: false })
    })
  })
})

describe("isSameLocation", () => {
  it("should compare World names case-insensitively", () => {
    expect(
      isSameLocation(
        { world: true, server: "A.dcl.eth", x: 0, y: 0 },
        { world: true, server: "a.dcl.eth", x: 0, y: 0 }
      )
    ).toBe(true)
  })

  it("should treat a parcel change as a new location", () => {
    expect(
      isSameLocation(
        { world: false, server: null, x: 1, y: 1 },
        { world: false, server: null, x: 1, y: 2 }
      )
    ).toBe(false)
  })
})

describe("occurrenceDaysBetween", () => {
  const from = new Date("2030-01-01T00:00:00Z").getTime()
  const to = new Date("2030-01-05T00:00:00Z").getTime()

  describe("when the event does not repeat", () => {
    it("should return the day it starts", () => {
      expect(
        Array.from(
          occurrenceDaysBetween(oneOff("2030-01-02T22:00:00Z"), from, to)
        )
      ).toEqual([day("2030-01-02")])
    })
  })

  describe("when the event repeats daily", () => {
    it("should return every day inside the range", () => {
      expect(
        Array.from(
          occurrenceDaysBetween(
            daily("2029-12-01T10:00:00Z", "2031-01-01T00:00:00Z"),
            from,
            to
          )
        )
      ).toEqual([
        day("2030-01-01"),
        day("2030-01-02"),
        day("2030-01-03"),
        day("2030-01-04"),
      ])
    })
  })

  describe("when a weekly event selects two weekdays", () => {
    it("should return only those days", () => {
      // 2030-01-01 is a Tuesday.
      expect(
        Array.from(
          occurrenceDaysBetween(
            {
              ...weekly("2029-12-31T10:00:00Z", "2031-01-01T00:00:00Z"),
              recurrent_weekday_mask:
                WeekdayMask.TUESDAY | WeekdayMask.THURSDAY,
            },
            from,
            to
          )
        )
      ).toEqual([day("2030-01-01"), day("2030-01-03")])
    })
  })
})

describe("validatePlaceDailyLimit", () => {
  const getActiveEventsAtPlace = EventModel.getActiveEventsAtPlace as jest.Mock

  beforeEach(() => {
    getActiveEventsAtPlace.mockResolvedValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when the place has fewer than 2 events that day", () => {
    beforeEach(() => {
      getActiveEventsAtPlace.mockResolvedValueOnce([
        stored(oneOff("2030-01-03T08:00:00Z")),
      ])
    })

    it("should accept the event", async () => {
      await expect(
        validatePlaceDailyLimit({
          event: oneOff("2030-01-03T20:00:00Z"),
          place: LAND_PLACE,
          now: NOW,
        })
      ).resolves.toBeUndefined()
    })

    it("should query the scene's parcels up to the end of the event's day", async () => {
      await validatePlaceDailyLimit({
        event: oneOff("2030-01-03T20:00:00Z"),
        place: LAND_PLACE,
        eventId: "event-1",
        now: NOW,
      })
      expect(getActiveEventsAtPlace).toHaveBeenCalledWith({
        world_name: null,
        positions: [
          [50, 50],
          [51, 50],
        ],
        exclude_id: "event-1",
        start_before: new Date("2030-01-04T00:00:00Z"),
      })
    })
  })

  describe("when the place already has 2 events that day", () => {
    beforeEach(() => {
      getActiveEventsAtPlace.mockResolvedValueOnce([
        stored(oneOff("2030-01-03T08:00:00Z")),
        stored(daily("2029-12-01T15:00:00Z", "2031-01-01T00:00:00Z")),
      ])
    })

    it("should reject the event with the place_daily_limit_reached code and the date", async () => {
      expect.assertions(3)
      try {
        await validatePlaceDailyLimit({
          event: oneOff("2030-01-03T20:00:00Z"),
          place: LAND_PLACE,
          now: NOW,
        })
      } catch (error: any) {
        expect(error.message).toMatch(
          /already has 2 events scheduled on 2030-01-03/
        )
        expect(error.code).toBe(SchedulingLimitErrorCode.PlaceDailyLimitReached)
        expect(error.data.date).toBe("2030-01-03")
      }
    })
  })

  describe("when the other events are on different days", () => {
    beforeEach(() => {
      getActiveEventsAtPlace.mockResolvedValueOnce([
        stored(oneOff("2030-01-02T08:00:00Z")),
        stored(oneOff("2030-01-04T08:00:00Z")),
      ])
    })

    it("should accept the event", async () => {
      await expect(
        validatePlaceDailyLimit({
          event: oneOff("2030-01-03T20:00:00Z"),
          place: LAND_PLACE,
          now: NOW,
        })
      ).resolves.toBeUndefined()
    })
  })

  describe("when a new daily event meets 2 daily events already at the place", () => {
    beforeEach(() => {
      getActiveEventsAtPlace.mockResolvedValueOnce([
        stored(daily("2029-12-01T08:00:00Z", "2031-01-01T00:00:00Z")),
        stored(daily("2029-12-01T15:00:00Z", "2031-01-01T00:00:00Z")),
      ])
    })

    it("should reject it on its first day", async () => {
      await expect(
        validatePlaceDailyLimit({
          event: daily("2030-01-02T20:00:00Z", "2030-03-01T00:00:00Z"),
          place: LAND_PLACE,
          now: NOW,
        })
      ).rejects.toThrow(/2030-01-02/)
    })
  })

  describe("when the event is at Genesis Plaza", () => {
    it("should accept it without counting", async () => {
      await validatePlaceDailyLimit({
        event: oneOff("2030-01-03T20:00:00Z"),
        place: resolveSchedulingPlace(
          { world: false, server: null, x: 0, y: 0 },
          { positions: ["0,0", "1,0"] }
        ),
        now: NOW,
      })
      expect(getActiveEventsAtPlace).not.toHaveBeenCalled()
    })
  })

  describe("when the event is in a World", () => {
    it("should count the World's events", async () => {
      await validatePlaceDailyLimit({
        event: oneOff("2030-01-03T20:00:00Z"),
        place: { world: true, name: "myworld.dcl.eth" },
        now: NOW,
      })
      expect(getActiveEventsAtPlace).toHaveBeenCalledWith(
        expect.objectContaining({
          world_name: "myworld.dcl.eth",
          positions: [],
        })
      )
    })
  })

  describe("when an edit keeps the days the event already held", () => {
    beforeEach(() => {
      getActiveEventsAtPlace.mockResolvedValue([
        stored(oneOff("2030-01-03T08:00:00Z")),
        stored(oneOff("2030-01-03T10:00:00Z")),
      ])
    })

    it("should accept it without counting", async () => {
      await validatePlaceDailyLimit({
        event: oneOff("2030-01-03T21:00:00Z"),
        previous: oneOff("2030-01-03T20:00:00Z"),
        place: LAND_PLACE,
        now: NOW,
      })
      expect(getActiveEventsAtPlace).not.toHaveBeenCalled()
    })
  })

  describe("when an edit moves the event to a full day", () => {
    beforeEach(() => {
      getActiveEventsAtPlace.mockResolvedValue([
        stored(oneOff("2030-01-04T08:00:00Z")),
        stored(oneOff("2030-01-04T10:00:00Z")),
      ])
    })

    it("should reject it", async () => {
      await expect(
        validatePlaceDailyLimit({
          event: oneOff("2030-01-04T20:00:00Z"),
          previous: oneOff("2030-01-03T20:00:00Z"),
          place: LAND_PLACE,
          now: NOW,
        })
      ).rejects.toThrow(/2030-01-04/)
    })
  })
})
