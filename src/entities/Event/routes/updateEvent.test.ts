import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"

import { getEvent } from "./getEvent"
import { updateEvent } from "./updateEvent"
import EventAttendeeModel from "../../EventAttendee/model"
import EventCategoryModel from "../../EventCategory/model"
import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfilePermissions,
  ProfileSettingsSessionAttributes,
} from "../../ProfileSettings/types"
import EventModel from "../model"
import { DeprecatedEventAttributes, EventAttributes } from "../types"

const mockGetProfiles = jest.fn().mockResolvedValue([])

jest.mock("decentraland-gatsby/dist/entities/Auth/isAdmin", () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock("decentraland-gatsby/dist/entities/Route/validate", () => ({
  createValidator: jest.fn().mockReturnValue(jest.fn()),
}))
jest.mock("decentraland-gatsby/dist/utils/api/API", () => {
  class MockAPI {
    static catch = () => Promise.resolve(null)
  }
  return MockAPI
})
jest.mock("decentraland-gatsby/dist/utils/api/Catalyst", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({ getProfiles: mockGetProfiles }),
  },
}))
jest.mock("decentraland-gatsby/dist/utils/api/Land", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getTile: () => Promise.resolve(null),
    }),
  },
}))
jest.mock("@dcl/schemas/dist/dapps/world", () => ({
  isInsideWorldLimits: () => true,
}))

jest.mock("./getEvent")
jest.mock("../model")
jest.mock("../schemas", () => ({
  newEventSchema: {
    type: "object",
    properties: {},
    additionalProperties: true,
  },
}))
jest.mock("../utils", () => {
  const actual = jest.requireActual("../utils")
  return {
    ...actual,
    calculateRecurrentProperties: () => ({
      recurrent_dates: [new Date("2030-01-01T00:00:00Z")],
      finish_at: new Date("2030-01-01T01:00:00Z"),
    }),
    eventTargetUrl: () => "https://decentraland.org/jump",
    validateImageUrl: () => Promise.resolve(undefined),
  }
})
jest.mock("../../../api/Communities", () => ({
  __esModule: true,
  default: {
    get: () => ({
      getCommunitiesWithToken: () => Promise.resolve([]),
      getCommunityMembers: () => Promise.resolve([]),
      getCommunity: () => Promise.resolve(null),
    }),
  },
}))
jest.mock("../../../api/Places", () => ({
  __esModule: true,
  default: {
    get: () => ({
      getPlaceByPosition: () => Promise.resolve(null),
      getWorldByName: () => Promise.resolve(null),
    }),
  },
}))
jest.mock("../../EventAttendee/model")
jest.mock("../../EventCategory/model")
jest.mock("../../Notifications", () => ({
  sendEventCreated: jest.fn(),
  sendEventStarted: jest.fn(),
  sendEventStartsSoon: jest.fn(),
  sendEventEnded: jest.fn(),
}))
jest.mock("../../ProfileSettings/routes/getAuthProfileSettings")
jest.mock("../../Schedule/model")
jest.mock("../../Schedule/utils", () => ({
  getMissingSchedules: jest.fn().mockReturnValue([]),
}))
jest.mock("../../Slack/utils", () => ({
  notifyApprovedEvent: jest.fn(),
  notifyEditedEvent: jest.fn(),
  notifyRejectedEvent: jest.fn(),
}))

const OWNER_ADDRESS = "0x1111111111111111111111111111111111111111"
const OTHER_USER_ADDRESS = "0x2222222222222222222222222222222222222222"
const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000"

function createBaseEvent(
  overrides: Partial<EventAttributes> = {}
): DeprecatedEventAttributes {
  const startAt = new Date("2030-01-01T00:00:00Z")
  return {
    id: EVENT_ID,
    name: "Original Event",
    image: "https://example.com/image.png",
    image_vertical: null,
    description: "Original description",
    start_at: startAt,
    finish_at: new Date("2030-01-01T01:00:00Z"),
    next_start_at: startAt,
    next_finish_at: new Date("2030-01-01T01:00:00Z"),
    duration: 3600000,
    all_day: false,
    x: 0,
    y: 0,
    server: null,
    url: "https://decentraland.org/jump?position=0,0",
    user: OWNER_ADDRESS,
    estate_id: null,
    estate_name: null,
    user_name: "OriginalUser",
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
    recurrent_interval: 0,
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
    world: false,
    place_id: null,
    community_id: null,
    scene_name: null,
    coordinates: [0, 0],
    ...overrides,
  }
}

function createProfileSettings(
  user: string,
  permissions: ProfilePermissions[] = []
): ProfileSettingsSessionAttributes {
  return {
    ...DEFAULT_PROFILE_SETTINGS,
    user,
    permissions,
    subscriptions: [],
  }
}

function createRequest(
  user: string,
  body: Record<string, unknown> = {}
): WithAuthProfile<WithAuth> {
  return {
    auth: user,
    params: { event_id: EVENT_ID },
    body,
  } as unknown as WithAuthProfile<WithAuth>
}

describe("updateEvent", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when the caller is not the event owner", () => {
    describe("and has no special permissions", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS)
        req = createRequest(OTHER_USER_ADDRESS, {
          name: "Hacked Event Name",
          description: "Hacked description",
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should throw a Forbidden error", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          "You don't have permission to edit this event"
        )
      })

      it("should not persist any changes to the database", async () => {
        await expect(updateEvent(req)).rejects.toThrow()

        expect(EventModel.update).not.toHaveBeenCalled()
      })
    })

    describe("and tries to reject the event", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS)
        req = createRequest(OTHER_USER_ADDRESS, { rejected: true })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should throw a Forbidden error", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          "You don't have permission to edit this event"
        )
      })
    })

    describe("and tries to change the event coordinates", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS)
        req = createRequest(OTHER_USER_ADDRESS, { x: 100, y: 200 })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should throw a Forbidden error", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          "You don't have permission to edit this event"
        )
      })
    })

    describe("and tries to change the event image", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS)
        req = createRequest(OTHER_USER_ADDRESS, {
          image: "https://attacker.com/phishing.png",
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should throw a Forbidden error", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          "You don't have permission to edit this event"
        )
      })
    })

    describe("and has the EditAnyEvent permission", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS, [
          ProfilePermissions.EditAnyEvent,
        ])
        req = createRequest(OTHER_USER_ADDRESS, {
          name: "Editor Updated Name",
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(EventModel.textsearch as jest.Mock).mockReturnValueOnce(null)
        ;(EventModel.selectNextStartAt as jest.Mock).mockReturnValueOnce(
          new Date("2030-01-01T00:00:00Z")
        )
        ;(EventModel.toPublic as jest.Mock).mockReturnValueOnce({})
        ;(EventAttendeeModel.findOne as jest.Mock).mockResolvedValueOnce(null)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should allow the update", async () => {
        await expect(updateEvent(req)).resolves.toBeDefined()
      })

      it("should persist the changes to the database", async () => {
        await updateEvent(req)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Editor Updated Name" }),
          { id: EVENT_ID }
        )
      })
    })

    describe("and is an admin", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS)
        req = createRequest(OTHER_USER_ADDRESS, {
          name: "Admin Updated Name",
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(true)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(EventModel.textsearch as jest.Mock).mockReturnValueOnce(null)
        ;(EventModel.selectNextStartAt as jest.Mock).mockReturnValueOnce(
          new Date("2030-01-01T00:00:00Z")
        )
        ;(EventModel.toPublic as jest.Mock).mockReturnValueOnce({})
        ;(EventAttendeeModel.findOne as jest.Mock).mockResolvedValueOnce(null)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should allow the update", async () => {
        await expect(updateEvent(req)).resolves.toBeDefined()
      })

      it("should persist the changes to the database", async () => {
        await updateEvent(req)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Admin Updated Name" }),
          { id: EVENT_ID }
        )
      })
    })
  })

  describe("when the caller is the event owner", () => {
    describe("and updates basic event fields", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OWNER_ADDRESS)
        req = createRequest(OWNER_ADDRESS, {
          name: "Updated Event Name",
          description: "Updated description",
          x: 10,
          y: 20,
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(EventModel.textsearch as jest.Mock).mockReturnValueOnce(null)
        ;(EventModel.selectNextStartAt as jest.Mock).mockReturnValueOnce(
          new Date("2030-01-01T00:00:00Z")
        )
        ;(EventModel.toPublic as jest.Mock).mockReturnValueOnce({})
        ;(EventAttendeeModel.findOne as jest.Mock).mockResolvedValueOnce(null)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should persist the changes to the database", async () => {
        await updateEvent(req)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Updated Event Name",
            description: "Updated description",
          }),
          { id: EVENT_ID }
        )
      })
    })

    describe("and updates owner-only fields", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OWNER_ADDRESS)
        req = createRequest(OWNER_ADDRESS, {
          contact: "owner@example.com",
          details: "VIP details",
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(EventModel.textsearch as jest.Mock).mockReturnValueOnce(null)
        ;(EventModel.selectNextStartAt as jest.Mock).mockReturnValueOnce(
          new Date("2030-01-01T00:00:00Z")
        )
        ;(EventModel.toPublic as jest.Mock).mockReturnValueOnce({})
        ;(EventAttendeeModel.findOne as jest.Mock).mockResolvedValueOnce(null)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should persist the owner-only fields to the database", async () => {
        await updateEvent(req)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            contact: "owner@example.com",
            details: "VIP details",
          }),
          { id: EVENT_ID }
        )
      })
    })

    describe("and does not have the approved permission", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent({ approved: false })
        profile = createProfileSettings(OWNER_ADDRESS)
        req = createRequest(OWNER_ADDRESS, {
          approved: true,
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(EventModel.textsearch as jest.Mock).mockReturnValueOnce(null)
        ;(EventModel.selectNextStartAt as jest.Mock).mockReturnValueOnce(
          new Date("2030-01-01T00:00:00Z")
        )
        ;(EventModel.toPublic as jest.Mock).mockReturnValueOnce({})
        ;(EventAttendeeModel.findOne as jest.Mock).mockResolvedValueOnce(null)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should not include the approved field in the update", async () => {
        await updateEvent(req)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.not.objectContaining({ approved: true }),
          { id: EVENT_ID }
        )
      })
    })
  })

  describe("when a non-owner sends editEventAttributes fields", () => {
    describe("and has no permissions", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent()
        profile = createProfileSettings(OTHER_USER_ADDRESS)
        req = createRequest(OTHER_USER_ADDRESS, {
          name: "Attacker Name",
          description: "Attacker injected description",
          image: "https://attacker.com/malicious.png",
          rejected: true,
          x: 999,
          y: 999,
          start_at: new Date("2020-01-01T00:00:00Z").toJSON(),
          duration: 1000,
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should throw a Forbidden error without persisting any changes", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          "You don't have permission to edit this event"
        )

        expect(EventModel.update).not.toHaveBeenCalled()
      })
    })
  })

  describe("when the owner edits a grandfathered recurrent event", () => {
    // An event that would exceed MAX_RECURRENT_PAST_ITERATIONS if it were
    // being created today: HOURLY frequency with start_at 10 years ago
    // (~88k past iterations, over the 50k cap).
    const tenYearsAgo = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)

    describe("and the edit touches only non-recurrence fields", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent({
          start_at: tenYearsAgo,
          recurrent: true,
          recurrent_frequency: "HOURLY" as EventAttributes["recurrent_frequency"],
          recurrent_interval: 1,
          recurrent_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        profile = createProfileSettings(OWNER_ADDRESS)
        req = createRequest(OWNER_ADDRESS, { name: "Updated name" })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
        ;(EventAttendeeModel.findOne as jest.Mock).mockResolvedValueOnce(null)
        ;(EventModel.selectNextStartAt as jest.Mock).mockReturnValueOnce(
          new Date("2030-01-01T00:00:00Z")
        )
        ;(EventModel.toPublic as jest.Mock).mockReturnValueOnce({
          ...event,
          attending: false,
        })
      })

      it("should not reject the edit for exceeding the iteration cap", async () => {
        await expect(updateEvent(req)).resolves.toBeDefined()
        expect(EventModel.update).toHaveBeenCalled()
      })
    })

    describe("and the edit touches start_at", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent({
          start_at: tenYearsAgo,
          recurrent: true,
          recurrent_frequency: "HOURLY" as EventAttributes["recurrent_frequency"],
          recurrent_interval: 1,
          recurrent_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        profile = createProfileSettings(OWNER_ADDRESS)
        req = createRequest(OWNER_ADDRESS, {
          start_at: tenYearsAgo.toJSON(),
        })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should reject the edit for exceeding the iteration cap", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          /too many past occurrences/
        )
        expect(EventModel.update).not.toHaveBeenCalled()
      })
    })

    describe("and the edit changes the recurrence frequency", () => {
      let event: DeprecatedEventAttributes
      let profile: ProfileSettingsSessionAttributes
      let req: WithAuthProfile<WithAuth>

      beforeEach(() => {
        event = createBaseEvent({
          start_at: tenYearsAgo,
          recurrent: true,
          recurrent_frequency: "DAILY" as EventAttributes["recurrent_frequency"],
          recurrent_interval: 1,
          recurrent_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        profile = createProfileSettings(OWNER_ADDRESS)
        req = createRequest(OWNER_ADDRESS, { recurrent_frequency: "HOURLY" })
        ;(getEvent as jest.Mock).mockResolvedValueOnce(event)
        ;(getAuthProfileSettings as jest.Mock).mockResolvedValueOnce(profile)
        ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
      })

      it("should reject the edit for exceeding the iteration cap", async () => {
        await expect(updateEvent(req)).rejects.toThrow(
          /too many past occurrences/
        )
        expect(EventModel.update).not.toHaveBeenCalled()
      })

      it("should fail fast without calling Catalyst.getProfiles", async () => {
        mockGetProfiles.mockClear()
        await expect(updateEvent(req)).rejects.toThrow()

        // The cap check is placed above the external-API block so a
        // rejected PATCH doesn't cost an upstream profile lookup.
        expect(mockGetProfiles).not.toHaveBeenCalled()
      })
    })
  })
})
