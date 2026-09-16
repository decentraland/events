import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { WithAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"

import { createEvent } from "./createEvent"
import * as utils from "../utils"

jest.mock("decentraland-gatsby/dist/entities/Route/validate", () => ({
  createValidator: jest.fn().mockReturnValue(jest.fn()),
}))
jest.mock("decentraland-gatsby/dist/utils/api/API", () => {
  class MockAPI {
    static catch = () => Promise.resolve(null)
  }
  return MockAPI
})
jest.mock("decentraland-gatsby/dist/utils/api/Land", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getTiles: () => Promise.resolve(null),
      getParcelImage: () => "https://example.com/img.png",
      getEstateImage: () => "https://example.com/estate.png",
    }),
  },
}))
jest.mock("@dcl/schemas/dist/dapps/world", () => ({
  isInsideWorldLimits: () => true,
}))
jest.mock("../model")
jest.mock("../schemas", () => ({
  newEventSchema: { type: "object", properties: {}, additionalProperties: true },
}))
jest.mock("../utils", () => {
  const actual = jest.requireActual("../utils")
  return {
    ...actual,
    calculateRecurrentProperties: jest.fn(() => ({
      recurrent_dates: [new Date("2030-01-01T00:00:00Z")],
      finish_at: new Date("2030-01-01T01:00:00Z"),
      recurrent: false,
      recurrent_until: null,
      duration: 3600000,
      start_at: new Date("2030-01-01T00:00:00Z"),
    })),
    eventTargetUrl: () => "https://decentraland.org/jump",
    validateImageUrl: () => Promise.resolve(undefined),
    estimateRecurrentPastIterations: () => 0,
  }
})
jest.mock("../../../api/Communities", () => ({
  __esModule: true,
  default: { get: () => ({ getCommunitiesWithToken: () => Promise.resolve([]) }) },
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
jest.mock("../../EventCategory/model")
jest.mock("../../ProfileSettings/routes/getAuthProfileSettings", () => ({
  getAuthProfileSettings: jest.fn().mockResolvedValue({
    user: "0x1111111111111111111111111111111111111111",
    permissions: [],
    subscriptions: [],
  }),
}))
jest.mock("../../Slack/utils", () => ({ notifyNewEvent: jest.fn() }))

const USER_ADDRESS = "0x1111111111111111111111111111111111111111"

function createRequest(
  body: Record<string, unknown> = {}
): WithAuthProfile<WithAuth> {
  return {
    auth: USER_ADDRESS,
    authProfile: { name: "TestUser" },
    body: {
      name: "Test Event",
      description: "A test event",
      x: 0,
      y: 0,
      categories: [],
      start_at: new Date("2030-01-01T00:00:00Z").toJSON(),
      duration: 3600000,
      recurrent: false,
      world: false,
      all_day: false,
      recurrent_frequency: null,
      recurrent_setpos: null,
      recurrent_monthday: null,
      recurrent_weekday_mask: 0,
      recurrent_month_mask: 0,
      recurrent_interval: 1,
      recurrent_count: null,
      recurrent_until: null,
      ...body,
    },
  } as unknown as WithAuthProfile<WithAuth>
}

describe("createEvent — past-date temporal validation", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when finish_at computed by calculateRecurrentProperties is in the past", () => {
    beforeEach(() => {
      ;(utils.calculateRecurrentProperties as jest.Mock).mockReturnValueOnce({
        recurrent_dates: [],
        finish_at: new Date("2020-01-01T01:00:00Z"),
        recurrent: false,
        recurrent_until: null,
        duration: 3600000,
        start_at: new Date("2020-01-01T00:00:00Z"),
      })
    })

    it("should reject with a 400 error referencing the past end date", async () => {
      await expect(createEvent(createRequest())).rejects.toThrow(
        /end date is already in the past/
      )
    })
  })

  describe("when recurrent_until is in the past but start_at is in the future", () => {
    beforeEach(() => {
      ;(utils.calculateRecurrentProperties as jest.Mock).mockReturnValueOnce({
        recurrent_dates: [new Date("2030-01-01T00:00:00Z")],
        finish_at: new Date("2030-01-01T01:00:00Z"),
        recurrent: true,
        recurrent_until: new Date("2020-06-01T00:00:00Z"),
        duration: 3600000,
        start_at: new Date("2030-01-01T00:00:00Z"),
      })
    })

    it("should reject with a 400 error referencing the past recurrence end date", async () => {
      await expect(
        createEvent(
          createRequest({
            recurrent: true,
            recurrent_until: new Date("2020-06-01T00:00:00Z").toJSON(),
          })
        )
      ).rejects.toThrow(/recurrence end date.*must be in the future/i)
    })
  })
})
