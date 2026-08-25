import { AuthIdentity } from "@dcl/crypto/dist/types"
import { signedHeaderFactory } from "decentraland-crypto-fetch"
import supertest from "supertest"

import EventModel from "../../src/entities/Event/model"
import { createIdentity } from "../mocks/identity"
import { cleanTables, closeTestDb, initTestDb } from "../setup/db"
import { createTestApp } from "../setup/server"

jest.mock("decentraland-gatsby/dist/utils/env", () => {
  return jest.fn((key: string, defaultValue?: string) => {
    if (key === "EVENTS_ADMIN_AUTH_TOKEN") {
      return "integration-events-admin-token"
    }

    return process.env[key] ?? defaultValue
  })
})

jest.mock("decentraland-gatsby/dist/utils/api/API", () => {
  class MockAPI {
    static catch = (promise: Promise<unknown>) =>
      promise.catch(() => null as unknown)
  }
  return MockAPI
})

const mockGetProfiles = jest.fn()
jest.mock("decentraland-gatsby/dist/utils/api/Catalyst", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({ getProfiles: mockGetProfiles }),
    get: () => ({ getProfiles: mockGetProfiles }),
  },
}))

jest.mock("decentraland-gatsby/dist/utils/api/Land", () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getTile: () => Promise.resolve(null),
      getTiles: () => Promise.resolve(null),
      getParcelImage: () => "https://example.com/parcel.png",
      getEstateImage: () => "https://example.com/estate.png",
    }),
  },
}))

jest.mock("../../src/api/Places", () => ({
  __esModule: true,
  default: {
    get: () => ({
      getPlaceByPosition: () => Promise.resolve(null),
      getWorldByName: () => Promise.resolve(null),
    }),
  },
}))

jest.mock("../../src/api/Communities", () => ({
  __esModule: true,
  default: {
    get: () => ({
      getCommunitiesWithToken: () => Promise.resolve([]),
      getCommunityMembers: () => Promise.resolve([]),
      getCommunity: () => Promise.resolve(null),
    }),
  },
}))

jest.mock("../../src/entities/Notifications", () => ({
  sendEventCreated: jest.fn(),
  sendEventStarted: jest.fn(),
  sendEventStartsSoon: jest.fn(),
  sendEventEnded: jest.fn(),
  sendEventApproved: jest.fn(),
  sendEventRejected: jest.fn(),
}))

jest.mock("../../src/entities/Slack/utils", () => ({
  notifyNewEvent: jest.fn(),
  notifyApprovedEvent: jest.fn(),
  notifyEditedEvent: jest.fn(),
  notifyRejectedEvent: jest.fn(),
}))

const app = createTestApp()
let dbInitialized = false

const FEATURED_ITEM =
  "urn:decentraland:matic:collections-v2:0x1234567890abcdef1234567890abcdef12345678:1"

function signedPost(
  identity: AuthIdentity,
  path: string,
  body: Record<string, unknown>
) {
  const createHeaders = signedHeaderFactory()
  const headers = createHeaders(identity, "POST", path, {})

  const headerObj: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    headerObj[key] = value
  })

  return supertest(app).post(path).set(headerObj).send(body)
}

function newEventBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Created Event",
    description: "Created description",
    start_at: new Date("2030-01-01T00:00:00Z").toISOString(),
    duration: 60 * 60 * 1000,
    x: 0,
    y: 0,
    categories: [],
    ...overrides,
  }
}

describe("POST /api/events", () => {
  let ownerIdentity: AuthIdentity

  beforeAll(async () => {
    await initTestDb()
    dbInitialized = true
  })

  afterAll(async () => {
    if (dbInitialized) {
      await closeTestDb()
    }
  })

  beforeEach(async () => {
    const owner = await createIdentity()
    ownerIdentity = owner.identity
    mockGetProfiles.mockResolvedValue([
      { ethAddress: owner.address, name: "Creator" },
    ])
  })

  afterEach(async () => {
    if (dbInitialized) {
      await cleanTables()
    }
    jest.clearAllMocks()
  })

  describe("when featured_item is a valid collections-v2 URN", () => {
    it("should respond with 201 and include featured_item", async () => {
      const response = await signedPost(
        ownerIdentity,
        "/api/events",
        newEventBody({ featured_item: FEATURED_ITEM })
      )

      expect(response.status).toBe(201)
      expect(response.body.data.featured_item).toBe(FEATURED_ITEM)
    })

    it("should persist featured_item to the database", async () => {
      const response = await signedPost(
        ownerIdentity,
        "/api/events",
        newEventBody({ featured_item: FEATURED_ITEM })
      ).expect(201)

      const stored = await EventModel.findOne({ id: response.body.data.id })
      expect(stored?.featured_item).toBe(FEATURED_ITEM)
    })
  })

  describe("when featured_item is an empty string", () => {
    it("should normalize it to null", async () => {
      const response = await signedPost(
        ownerIdentity,
        "/api/events",
        newEventBody({ featured_item: "" })
      )

      expect(response.status).toBe(201)
      expect(response.body.data.featured_item).toBeNull()

      const stored = await EventModel.findOne({ id: response.body.data.id })
      expect(stored?.featured_item).toBeNull()
    })
  })

  describe("when featured_item is omitted", () => {
    it("should store null", async () => {
      const response = await signedPost(
        ownerIdentity,
        "/api/events",
        newEventBody()
      )

      expect(response.status).toBe(201)
      expect(response.body.data.featured_item).toBeNull()
    })
  })

  describe("when featured_item is not a valid collections-v2 URN", () => {
    it.each([
      ["plain text", "my favourite wearable"],
      [
        "unsupported chain",
        "urn:decentraland:mainnet:collections-v2:0x1234567890abcdef1234567890abcdef12345678:1",
      ],
      [
        "collections-v1",
        "urn:decentraland:matic:collections-v1:0x1234567890abcdef1234567890abcdef12345678:1",
      ],
      ["longer than 160 chars", `${FEATURED_ITEM}${"1".repeat(130)}`],
    ])("should respond with 400 Bad Request for %s", async (_label, value) => {
      const response = await signedPost(
        ownerIdentity,
        "/api/events",
        newEventBody({ featured_item: value })
      )

      expect(response.status).toBe(400)
      expect(await EventModel.count({ approved: false })).toBe(0)
    })
  })
})
