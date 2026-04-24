import { AuthIdentity } from "@dcl/crypto/dist/types"
import supertest from "supertest"

import { signedHeaderFactory } from "decentraland-crypto-fetch"

import { DeprecatedEventAttributes } from "../../src/entities/Event/types"
import { seedEvent } from "../mocks/event"
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
    static catch = () => Promise.resolve(null)
  }
  return MockAPI
})

const mockGetProfiles = jest.fn().mockResolvedValue([])
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
}))

jest.mock("../../src/entities/Slack/utils", () => ({
  notifyApprovedEvent: jest.fn(),
  notifyEditedEvent: jest.fn(),
  notifyRejectedEvent: jest.fn(),
}))

const ADMIN_TOKEN = "integration-events-admin-token"
const app = createTestApp()
let dbInitialized = false

function adminRequest(request: supertest.Test): supertest.Test {
  return request.set("Authorization", `Bearer ${ADMIN_TOKEN}`)
}

function signedGet(identity: AuthIdentity, path: string) {
  const createHeaders = signedHeaderFactory()
  const headers = createHeaders(identity, "GET", path, {})

  const headerObj: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    headerObj[key] = value
  })

  return supertest(app).get(path).set(headerObj)
}

describe("GET /api/events", () => {
  beforeAll(async () => {
    await initTestDb()
    dbInitialized = true
  })

  afterAll(async () => {
    if (dbInitialized) {
      await closeTestDb()
    }
  })

  afterEach(async () => {
    if (dbInitialized) {
      await cleanTables()
    }
    jest.clearAllMocks()
  })

  describe("when the request is public", () => {
    let approvedEvent: DeprecatedEventAttributes
    let pendingEvent: DeprecatedEventAttributes
    let rejectedEvent: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      approvedEvent = await seedEvent({
        approved: true,
        name: "Approved Public Event",
      })
      pendingEvent = await seedEvent({
        approved: false,
        name: "Pending Public Event",
      })
      rejectedEvent = await seedEvent({
        approved: false,
        name: "Rejected Public Event",
        rejected: true,
        rejection_reason: "Spam",
      })
      response = await supertest(app).get("/api/events")
    })

    it("should only list approved non-rejected events", async () => {
      const eventIds = response.body.data.map(
        (event: DeprecatedEventAttributes) => event.id
      )

      expect(response.status).toBe(200)
      expect(eventIds).toContain(approvedEvent.id)
      expect(eventIds).not.toContain(pendingEvent.id)
      expect(eventIds).not.toContain(rejectedEvent.id)
    })
  })

  describe("when the public request includes admin-only state filters", () => {
    let approvedEvent: DeprecatedEventAttributes
    let pendingEvent: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      approvedEvent = await seedEvent({ approved: true })
      pendingEvent = await seedEvent({ approved: false })
      response = await supertest(app).get(
        "/api/events?approved=false&rejected=false"
      )
    })

    it("should ignore those filters and keep public visibility rules", async () => {
      const eventIds = response.body.data.map(
        (event: DeprecatedEventAttributes) => event.id
      )

      expect(response.status).toBe(200)
      expect(eventIds).toContain(approvedEvent.id)
      expect(eventIds).not.toContain(pendingEvent.id)
    })
  })

  describe("when the request uses the admin bearer token", () => {
    let approvedEvent: DeprecatedEventAttributes
    let pendingEvent: DeprecatedEventAttributes
    let rejectedEvent: DeprecatedEventAttributes
    let otherCreatorEvent: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      approvedEvent = await seedEvent({
        approved: true,
        name: "Approved Event",
        user: "0x1111111111111111111111111111111111111111",
      })
      pendingEvent = await seedEvent({
        approved: false,
        name: "Pending Event",
        user: "0x1111111111111111111111111111111111111111",
      })
      rejectedEvent = await seedEvent({
        approved: false,
        name: "Rejected Event",
        rejected: true,
        rejection_reason: "Spam",
        user: "0x1111111111111111111111111111111111111111",
      })
      otherCreatorEvent = await seedEvent({
        approved: false,
        name: "Other Creator Event",
        user: "0x2222222222222222222222222222222222222222",
      })
      response = await adminRequest(supertest(app).get("/api/events"))
    })

    it("should include approved, pending, and rejected events", async () => {
      const eventIds = response.body.data.map(
        (event: DeprecatedEventAttributes) => event.id
      )

      expect(response.status).toBe(200)
      expect(eventIds).toContain(approvedEvent.id)
      expect(eventIds).toContain(pendingEvent.id)
      expect(eventIds).toContain(rejectedEvent.id)
      expect(eventIds).toContain(otherCreatorEvent.id)
    })
  })

  describe("when admin filters are combined with regular filters", () => {
    let matchingEvent: DeprecatedEventAttributes
    let wrongCreatorEvent: DeprecatedEventAttributes
    let wrongStateEvent: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      matchingEvent = await seedEvent({
        approved: false,
        name: "Matching Pending Event",
        user: "0x1111111111111111111111111111111111111111",
      })
      wrongCreatorEvent = await seedEvent({
        approved: false,
        name: "Wrong Creator Pending Event",
        user: "0x2222222222222222222222222222222222222222",
      })
      wrongStateEvent = await seedEvent({
        approved: true,
        name: "Approved Creator Event",
        user: "0x1111111111111111111111111111111111111111",
      })
      response = await adminRequest(
        supertest(app).get(
          "/api/events?approved=false&rejected=false&creator=0x1111111111111111111111111111111111111111"
        )
      )
    })

    it("should preserve regular filters and apply admin state filters", async () => {
      const eventIds = response.body.data.map(
        (event: DeprecatedEventAttributes) => event.id
      )

      expect(response.status).toBe(200)
      expect(eventIds).toContain(matchingEvent.id)
      expect(eventIds).not.toContain(wrongCreatorEvent.id)
      expect(eventIds).not.toContain(wrongStateEvent.id)
    })
  })
})

describe("GET /api/events/:event_id", () => {
  beforeAll(async () => {
    await initTestDb()
    dbInitialized = true
  })

  afterAll(async () => {
    if (dbInitialized) {
      await closeTestDb()
    }
  })

  afterEach(async () => {
    if (dbInitialized) {
      await cleanTables()
    }
    jest.clearAllMocks()
  })

  describe("when the event is approved and the request is public", () => {
    let event: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      event = await seedEvent({
        approved: true,
        contact: "owner@example.com",
        details: "Private details",
      })
      response = await supertest(app).get(`/api/events/${event.id}`)
    })

    it("should return the event without owner-only fields", async () => {
      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(event.id)
      expect(response.body.data.contact).toBeUndefined()
      expect(response.body.data.details).toBeUndefined()
    })
  })

  describe("when the event is pending and the request is public", () => {
    let event: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      event = await seedEvent({ approved: false })
      response = await supertest(app).get(`/api/events/${event.id}`)
    })

    it("should respond with 404 Not Found", async () => {
      expect(response.status).toBe(404)
    })
  })

  describe("when the event is rejected and the request is public", () => {
    let event: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      event = await seedEvent({
        approved: false,
        rejected: true,
        rejection_reason: "Spam",
      })
      response = await supertest(app).get(`/api/events/${event.id}`)
    })

    it("should respond with 404 Not Found", async () => {
      expect(response.status).toBe(404)
    })
  })

  describe("when the requester owns a pending event", () => {
    let event: DeprecatedEventAttributes
    let ownerIdentity: AuthIdentity
    let response: supertest.Response

    beforeEach(async () => {
      const owner = await createIdentity()
      ownerIdentity = owner.identity
      event = await seedEvent({
        approved: false,
        contact: "owner@example.com",
        details: "Private details",
        user: owner.address,
      })
      response = await signedGet(ownerIdentity, `/api/events/${event.id}`)
    })

    it("should return the event with owner-only fields", async () => {
      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(event.id)
      expect(response.body.data.contact).toBe("owner@example.com")
      expect(response.body.data.details).toBe("Private details")
    })
  })

  describe("when the event is rejected and the request uses the admin bearer token", () => {
    let event: DeprecatedEventAttributes
    let response: supertest.Response

    beforeEach(async () => {
      event = await seedEvent({
        approved: false,
        contact: "owner@example.com",
        details: "Private details",
        rejected: true,
        rejection_reason: "Spam",
      })
      response = await adminRequest(
        supertest(app).get(`/api/events/${event.id}`)
      )
    })

    it("should return the event and include owner-only fields", async () => {
      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(event.id)
      expect(response.body.data.rejected).toBe(true)
      expect(response.body.data.contact).toBe("owner@example.com")
      expect(response.body.data.details).toBe("Private details")
    })
  })
})
