import { AuthIdentity } from "@dcl/crypto/dist/types"
import supertest from "supertest"

import { signedHeaderFactory } from "decentraland-crypto-fetch"

import { DeprecatedEventAttributes } from "../../src/entities/Event/types"
import { seedEvent } from "../mocks/event"
import { createIdentity } from "../mocks/identity"
import { cleanTables, closeTestDb, initTestDb } from "../setup/db"
import { createTestApp } from "../setup/server"

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

const app = createTestApp()

function signedGet(identity: AuthIdentity, path: string) {
  // The auth middleware validates signatures against `req.baseUrl + req.path`,
  // which excludes the query string. Sign only the pathname to match.
  const url = new URL(path, "http://localhost")
  const createHeaders = signedHeaderFactory()
  const headers = createHeaders(identity, "GET", url.pathname, {})

  const headerObj: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    headerObj[key] = value
  })

  return supertest(app).get(path).set(headerObj)
}

describe("GET /api/events?owner=true", () => {
  beforeAll(async () => {
    await initTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  afterEach(async () => {
    await cleanTables()
    jest.clearAllMocks()
  })

  describe("when the request has no authentication", () => {
    it("should respond with 401 Unauthorized", async () => {
      const response = await supertest(app).get("/api/events?owner=true")

      expect(response.status).toBe(401)
    })

    it("should not leak events in the response body", async () => {
      const owner = await createIdentity()
      await seedEvent({ user: owner.address, approved: true })

      const response = await supertest(app).get("/api/events?owner=true")

      expect(response.status).toBe(401)
      expect(response.body.data).toBeUndefined()
    })
  })

  describe("when the request is authenticated", () => {
    let ownerIdentity: AuthIdentity
    let ownerAddress: string

    beforeEach(async () => {
      const owner = await createIdentity()
      ownerIdentity = owner.identity
      ownerAddress = owner.address
    })

    describe("and the user has events in every status", () => {
      let approvedEvent: DeprecatedEventAttributes
      let pendingEvent: DeprecatedEventAttributes
      let rejectedEvent: DeprecatedEventAttributes
      let otherUserEvent: DeprecatedEventAttributes

      beforeEach(async () => {
        approvedEvent = await seedEvent({
          user: ownerAddress,
          name: "Approved Event",
          approved: true,
          rejected: false,
        })
        pendingEvent = await seedEvent({
          user: ownerAddress,
          name: "Pending Event",
          approved: false,
          rejected: false,
        })
        rejectedEvent = await seedEvent({
          user: ownerAddress,
          name: "Rejected Event",
          approved: false,
          rejected: true,
        })

        const otherUser = await createIdentity()
        otherUserEvent = await seedEvent({
          user: otherUser.address,
          name: "Other User Event",
          approved: true,
          rejected: false,
        })
      })

      it("should return every event authored by the caller", async () => {
        const response = await signedGet(
          ownerIdentity,
          "/api/events?owner=true"
        )

        expect(response.status).toBe(200)
        const ids = response.body.data.map(
          (event: DeprecatedEventAttributes) => event.id
        )
        expect(ids).toEqual(
          expect.arrayContaining([
            approvedEvent.id,
            pendingEvent.id,
            rejectedEvent.id,
          ])
        )
        expect(ids).toHaveLength(3)
      })

      it("should include rejected events with rejected=true", async () => {
        const response = await signedGet(
          ownerIdentity,
          "/api/events?owner=true"
        )

        const rejected = response.body.data.find(
          (event: DeprecatedEventAttributes) => event.id === rejectedEvent.id
        )
        expect(rejected).toBeDefined()
        expect(rejected.rejected).toBe(true)
      })

      it("should not include events authored by other users", async () => {
        const response = await signedGet(
          ownerIdentity,
          "/api/events?owner=true"
        )

        const ids = response.body.data.map(
          (event: DeprecatedEventAttributes) => event.id
        )
        expect(ids).not.toContain(otherUserEvent.id)
      })
    })

    describe("and the caller passes a creator filter with a different address", () => {
      let callerApprovedEvent: DeprecatedEventAttributes
      let otherCreatorAddress: string

      beforeEach(async () => {
        callerApprovedEvent = await seedEvent({
          user: ownerAddress,
          approved: true,
        })
        const otherCreator = await createIdentity()
        otherCreatorAddress = otherCreator.address
        await seedEvent({ user: otherCreatorAddress, approved: true })
      })

      it("should ignore the creator param and return only the caller's events", async () => {
        const response = await signedGet(
          ownerIdentity,
          `/api/events?owner=true&creator=${otherCreatorAddress}`
        )

        expect(response.status).toBe(200)
        const ids = response.body.data.map(
          (event: DeprecatedEventAttributes) => event.id
        )
        expect(ids).toEqual([callerApprovedEvent.id])
      })
    })

    describe("and the caller filters by a date range", () => {
      let insideRange: DeprecatedEventAttributes
      let outsideRange: DeprecatedEventAttributes

      beforeEach(async () => {
        insideRange = await seedEvent({
          user: ownerAddress,
          name: "Inside",
          start_at: new Date("2030-06-15T10:00:00Z"),
          finish_at: new Date("2030-06-15T11:00:00Z"),
          next_start_at: new Date("2030-06-15T10:00:00Z"),
          next_finish_at: new Date("2030-06-15T11:00:00Z"),
          approved: false,
          rejected: true,
        })
        outsideRange = await seedEvent({
          user: ownerAddress,
          name: "Outside",
          start_at: new Date("2031-06-15T10:00:00Z"),
          finish_at: new Date("2031-06-15T11:00:00Z"),
          next_start_at: new Date("2031-06-15T10:00:00Z"),
          next_finish_at: new Date("2031-06-15T11:00:00Z"),
          approved: true,
          rejected: false,
        })
      })

      it("should only return events within the range", async () => {
        const from = "2030-06-01T00:00:00Z"
        const to = "2030-07-01T00:00:00Z"
        const response = await signedGet(
          ownerIdentity,
          `/api/events?owner=true&from=${encodeURIComponent(
            from
          )}&to=${encodeURIComponent(to)}`
        )

        expect(response.status).toBe(200)
        const ids = response.body.data.map(
          (event: DeprecatedEventAttributes) => event.id
        )
        expect(ids).toEqual([insideRange.id])
        expect(ids).not.toContain(outsideRange.id)
      })
    })

    describe("and the caller has no events", () => {
      it("should return an empty array", async () => {
        const other = await createIdentity()
        await seedEvent({ user: other.address, approved: true })

        const response = await signedGet(
          ownerIdentity,
          "/api/events?owner=true"
        )

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual([])
      })
    })
  })

  describe("when the query uses an unsupported list value", () => {
    it("should respond with 400 Bad Request", async () => {
      const { identity } = await createIdentity()
      const response = await signedGet(identity, "/api/events?list=foo")

      expect(response.status).toBe(400)
    })
  })
})
