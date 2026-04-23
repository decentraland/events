import EventCategoryModel from "../../EventCategory/model"
import {
  notifyApprovedEvent,
  notifyEditedEvent,
  notifyRejectedEvent,
} from "../../Slack/utils"
import EventModel from "../model"
import { DeprecatedEventAttributes, EventAttributes } from "../types"
import {
  approveEvent,
  getEventAdmin,
  getEventAdminList,
  patchEventAdmin,
  rejectEvent,
  unapproveEvent,
  unrejectEvent,
} from "./admin"

const VALID_TOKEN = "test-events-admin-token"
const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000"
const ACTOR = "jarvis-agent"

let mockEnvToken: string | undefined = VALID_TOKEN
const mockGetProfiles = jest.fn().mockResolvedValue([])

jest.mock("decentraland-gatsby/dist/utils/env", () => {
  return jest.fn((key: string, defaultValue?: string) => {
    if (key === "EVENTS_ADMIN_AUTH_TOKEN") {
      return mockEnvToken ?? defaultValue
    }
    return defaultValue
  })
})

jest.mock("@dcl/schemas/dist/dapps/world", () => ({
  isInsideWorldLimits: () => true,
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

jest.mock("../../../api/Places", () => ({
  __esModule: true,
  default: {
    get: () => ({
      getPlaceByPosition: () => Promise.resolve(null),
      getWorldByName: () => Promise.resolve(null),
    }),
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
    estimateRecurrentPastIterations: () => 0,
    eventTargetUrl: () => "https://decentraland.org/jump?position=0,0",
    validateImageUrl: jest.fn().mockResolvedValue(undefined),
  }
})

jest.mock("../model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    getEvents: jest.fn(),
    update: jest.fn(),
    build: jest.fn((event) =>
      event
        ? {
            ...event,
            scene_name: event.estate_name,
            coordinates: [event.x, event.y],
          }
        : event
    ),
    textsearch: jest.fn(() => null),
    selectNextStartAt: jest.fn(() => new Date("2030-01-01T00:00:00Z")),
    toPublic: jest.fn((event) => ({
      ...event,
      attending: false,
      live: false,
      position: [event.x, event.y],
    })),
  },
}))

jest.mock("../../EventCategory/model", () => ({
  __esModule: true,
  default: {
    validateCategories: jest.fn(),
  },
}))

jest.mock("../../Slack/utils", () => ({
  notifyApprovedEvent: jest.fn(),
  notifyEditedEvent: jest.fn(),
  notifyRejectedEvent: jest.fn(),
}))

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
    user: "0x1111111111111111111111111111111111111111",
    estate_id: null,
    estate_name: null,
    user_name: "OriginalUser",
    approved: false,
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
    world: false,
    place_id: null,
    community_id: null,
    scene_name: null,
    coordinates: [0, 0],
    ...overrides,
  }
}

function createAdminRequest(
  body: Record<string, unknown> = {},
  eventId = EVENT_ID
) {
  return {
    params: { event_id: eventId },
    body,
  } as any
}

function createBearerRequest(authorization?: string) {
  return {
    headers: authorization ? { authorization } : {},
  } as any
}

async function expectRequestError(
  promise: Promise<unknown>,
  statusCode: number
) {
  await expect(promise).rejects.toMatchObject({ statusCode })
}

describe("events admin endpoints", () => {
  afterEach(() => {
    jest.clearAllMocks()
    mockEnvToken = VALID_TOKEN
  })

  describe("authentication", () => {
    describe("when the authorization header is missing", () => {
      let request: ReturnType<typeof createBearerRequest>

      beforeEach(() => {
        request = createBearerRequest()
      })

      it("should reject the request with a 401", async () => {
        await jest.isolateModulesAsync(async () => {
          const freshModule = await import("./middleware/adminBearer")
          await expectRequestError(freshModule.assertAdminBearer(request), 401)
        })
      })
    })

    describe("when the authorization token is invalid", () => {
      let request: ReturnType<typeof createBearerRequest>

      beforeEach(() => {
        request = createBearerRequest("Bearer invalid-token")
      })

      it("should reject the request with a 401", async () => {
        await jest.isolateModulesAsync(async () => {
          const freshModule = await import("./middleware/adminBearer")
          await expectRequestError(freshModule.assertAdminBearer(request), 401)
        })
      })
    })

    describe("when EVENTS_ADMIN_AUTH_TOKEN is not configured", () => {
      let request: ReturnType<typeof createBearerRequest>

      beforeEach(() => {
        mockEnvToken = ""
        request = createBearerRequest(`Bearer ${VALID_TOKEN}`)
      })

      it("should reject the request with a 503", async () => {
        await jest.isolateModulesAsync(async () => {
          const freshModule = await import("./middleware/adminBearer")
          await expectRequestError(freshModule.assertAdminBearer(request), 503)
        })
      })
    })
  })

  describe("validation", () => {
    describe("when event_id is not a UUID", () => {
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        request = createAdminRequest({}, "invalid-event-id")
      })

      it("should reject the request with a 400", async () => {
        await expectRequestError(approveEvent(request), 400)
      })
    })

    describe("when rejectEvent has no reason", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent()
        request = createAdminRequest()
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
      })

      it("should reject the request with a 400", async () => {
        await expectRequestError(rejectEvent(request), 400)
      })
    })

    describe("when rejectEvent has an empty reason", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent()
        request = createAdminRequest({ reason: "   " })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
      })

      it("should reject the request with a 400", async () => {
        await expectRequestError(rejectEvent(request), 400)
      })
    })

    describe("when patchEventAdmin receives an unsupported field", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent()
        request = createAdminRequest({ unsupported: "field" })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
      })

      it("should reject the request with a 400", async () => {
        await expectRequestError(patchEventAdmin(request), 400)
      })
    })
  })

  describe("event lookup", () => {
    describe("when the event does not exist", () => {
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        request = createAdminRequest()
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(null)
      })

      it("should reject the request with a 404", async () => {
        await expectRequestError(approveEvent(request), 404)
      })
    })
  })

  describe("approveEvent", () => {
    describe("when the event is pending", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent()
        request = createAdminRequest({ actor: ACTOR })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
      })

      it("should approve the event", async () => {
        await approveEvent(request)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            approved: true,
            approved_by: ACTOR,
            rejected: false,
            rejection_reason: null,
          }),
          { id: EVENT_ID }
        )
      })

      it("should notify the approval", async () => {
        await approveEvent(request)

        expect(notifyApprovedEvent).toHaveBeenCalledWith(
          expect.objectContaining({ approved: true })
        )
      })
    })

    describe("when the event is already approved", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent({ approved: true, approved_by: ACTOR })
        request = createAdminRequest({ actor: ACTOR })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
      })

      it("should return without writing or notifying again", async () => {
        await approveEvent(request)

        expect(EventModel.update).not.toHaveBeenCalled()
        expect(notifyApprovedEvent).not.toHaveBeenCalled()
      })
    })
  })

  describe("getEventAdmin", () => {
    describe("when the event exists", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent()
        request = createAdminRequest()
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
      })

      it("should return the event even when it is pending", async () => {
        const response = await getEventAdmin(request)

        expect(response).toEqual(expect.objectContaining({ id: EVENT_ID }))
      })
    })
  })

  describe("getEventAdminList", () => {
    describe("when filtering pending events", () => {
      let event: DeprecatedEventAttributes
      let request: Record<string, unknown>

      beforeEach(() => {
        event = createBaseEvent()
        request = {
          query: { approved: "false", rejected: "false" },
        }
        ;(EventModel.getEvents as jest.Mock).mockResolvedValueOnce([event])
      })

      it("should query events with pending filters and allow pending rows", async () => {
        await getEventAdminList(request as any)

        expect(EventModel.getEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            allow_pending: true,
            include_rejected: true,
            approved: false,
            rejected: false,
          })
        )
      })
    })

    describe("when no rejection filter is provided", () => {
      let event: DeprecatedEventAttributes
      let request: Record<string, unknown>

      beforeEach(() => {
        event = createBaseEvent()
        request = {
          query: {},
        }
        ;(EventModel.getEvents as jest.Mock).mockResolvedValueOnce([event])
      })

      it("should include rejected rows in the admin query", async () => {
        await getEventAdminList(request as any)

        expect(EventModel.getEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            allow_pending: true,
            include_rejected: true,
            rejected: undefined,
          })
        )
      })
    })
  })

  describe("rejectEvent", () => {
    describe("when a reason is provided", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent({ highlighted: true, trending: true })
        request = createAdminRequest({
          actor: ACTOR,
          reason: "Suspicious external URL",
        })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
      })

      it("should reject the event and clear promotional flags", async () => {
        await rejectEvent(request)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            approved: false,
            rejected: true,
            rejected_by: ACTOR,
            rejection_reason: "Suspicious external URL",
            highlighted: false,
            trending: false,
          }),
          { id: EVENT_ID }
        )
      })

      it("should notify the rejection", async () => {
        await rejectEvent(request)

        expect(notifyRejectedEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            rejected: true,
            rejection_reason: "Suspicious external URL",
          })
        )
      })
    })
  })

  describe("unapproveEvent", () => {
    describe("when the event is approved", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent({ approved: true, approved_by: ACTOR })
        request = createAdminRequest()
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
      })

      it("should clear the approval flag", async () => {
        await unapproveEvent(request)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({ approved: false, approved_by: null }),
          { id: EVENT_ID }
        )
      })
    })
  })

  describe("unrejectEvent", () => {
    describe("when the event is rejected", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent({
          rejected: true,
          rejected_by: ACTOR,
          rejection_reason: "Suspicious external URL",
        })
        request = createAdminRequest()
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
      })

      it("should clear the rejection state", async () => {
        await unrejectEvent(request)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            rejected: false,
            rejected_by: null,
            rejection_reason: null,
          }),
          { id: EVENT_ID }
        )
      })
    })
  })

  describe("patchEventAdmin", () => {
    describe("when updating the name and description", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent({ approved: true })
        request = createAdminRequest({
          name: "Updated title",
          description: "Updated description",
        })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should persist the patch", async () => {
        await patchEventAdmin(request)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Updated title",
            description: "Updated description",
          }),
          { id: EVENT_ID }
        )
      })

      it("should notify the edit", async () => {
        await patchEventAdmin(request)

        expect(notifyEditedEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Updated title",
            description: "Updated description",
          })
        )
      })
    })

    describe("when the event has a custom URL", () => {
      let event: DeprecatedEventAttributes
      let request: ReturnType<typeof createAdminRequest>

      beforeEach(() => {
        event = createBaseEvent({
          approved: true,
          url: "https://community.example.com/custom-landing",
        })
        request = createAdminRequest({ name: "Renamed event" })
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce(event)
        ;(EventModel.update as jest.Mock).mockResolvedValueOnce(undefined)
        ;(
          EventCategoryModel.validateCategories as jest.Mock
        ).mockResolvedValueOnce(true)
      })

      it("should preserve the custom URL instead of regenerating it", async () => {
        await patchEventAdmin(request)

        expect(EventModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            url: "https://community.example.com/custom-landing",
          }),
          { id: EVENT_ID }
        )
      })
    })
  })
})
