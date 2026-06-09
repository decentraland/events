import { AuthIdentity } from "@dcl/crypto/dist/types"
import { signedHeaderFactory } from "decentraland-crypto-fetch"
import supertest from "supertest"

import EventModel from "../../src/entities/Event/model"
import { DeprecatedEventAttributes } from "../../src/entities/Event/types"
import { sendEventDeleted } from "../../src/entities/Notifications"
import { notifyDeletedEvent } from "../../src/entities/Slack/utils"
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

jest.mock("../../src/entities/Notifications", () => ({
  sendEventCreated: jest.fn(),
  sendEventStarted: jest.fn(),
  sendEventStartsSoon: jest.fn(),
  sendEventEnded: jest.fn(),
  sendEventApproved: jest.fn(),
  sendEventRejected: jest.fn(),
  sendEventDeleted: jest.fn(),
}))

jest.mock("../../src/entities/Slack/utils", () => ({
  notifyApprovedEvent: jest.fn(),
  notifyEditedEvent: jest.fn(),
  notifyRejectedEvent: jest.fn(),
  notifyDeletedEvent: jest.fn(),
}))

const app = createTestApp()
const ADMIN_TOKEN = "integration-events-admin-token"
let dbInitialized = false

function signedDelete(
  identity: AuthIdentity,
  path: string,
  body: Record<string, unknown> = {}
) {
  const createHeaders = signedHeaderFactory()
  const headers = createHeaders(identity, "DELETE", path, {})

  const headerObj: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    headerObj[key] = value
  })

  return supertest(app).delete(path).set(headerObj).send(body)
}

async function getAdminEvent(eventId: string) {
  return supertest(app)
    .get(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
}

describe("DELETE /api/events/:event_id", () => {
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

  describe("when the request has no authentication", () => {
    it("should respond with 401 Unauthorized", async () => {
      const owner = await createIdentity()
      const event = await seedEvent({ user: owner.address })

      const response = await supertest(app).delete(`/api/events/${event.id}`)

      expect(response.status).toBe(401)
    })
  })

  describe("when a non-owner without permissions deletes", () => {
    let event: DeprecatedEventAttributes
    let attackerIdentity: AuthIdentity

    beforeEach(async () => {
      const owner = await createIdentity()
      const attacker = await createIdentity()
      attackerIdentity = attacker.identity
      event = await seedEvent({ user: owner.address })
    })

    it("should respond with 403 and keep the event visible", async () => {
      const response = await signedDelete(
        attackerIdentity,
        `/api/events/${event.id}`
      )
      expect(response.status).toBe(403)

      const list = await supertest(app).get("/api/events").expect(200)
      expect(list.body.data.map((e: { id: string }) => e.id)).toContain(
        event.id
      )
    })
  })

  describe("when the owner deletes their own event", () => {
    let event: DeprecatedEventAttributes
    let ownerIdentity: AuthIdentity
    let ownerAddress: string

    beforeEach(async () => {
      const owner = await createIdentity()
      ownerIdentity = owner.identity
      ownerAddress = owner.address
      event = await seedEvent({ user: owner.address })
    })

    it("marks it deleted_by_user, hides it from listings, and does not notify", async () => {
      const response = await signedDelete(
        ownerIdentity,
        `/api/events/${event.id}`
      )
      expect(response.status).toBe(200)

      const stored = await EventModel.findOne<DeprecatedEventAttributes>({
        id: event.id,
      })
      expect(stored?.deleted_by_user).toBe(true)
      expect(stored?.deleted_by_admin).toBe(false)
      expect(stored?.deleted_by?.toLowerCase()).toBe(ownerAddress.toLowerCase())
      expect(stored?.deleted_at).not.toBeNull()

      // Hidden from the public listing (owner-list exclusion is covered by the
      // model-level buildEventFilterConditions unit test).
      const publicList = await supertest(app).get("/api/events").expect(200)
      expect(
        publicList.body.data.map((e: { id: string }) => e.id)
      ).not.toContain(event.id)

      expect(notifyDeletedEvent).not.toHaveBeenCalled()
      expect(sendEventDeleted).not.toHaveBeenCalled()
    })
  })

  describe("when an admin (bearer) deletes the event", () => {
    let event: DeprecatedEventAttributes

    beforeEach(async () => {
      const owner = await createIdentity()
      event = await seedEvent({ user: owner.address })
    })

    it("marks it deleted_by_admin and notifies the creator", async () => {
      const response = await supertest(app)
        .delete(`/api/events/${event.id}`)
        .set("Authorization", `Bearer ${ADMIN_TOKEN}`)
        .send({ reason: "Against the rules" })
      expect(response.status).toBe(200)

      const stored = await EventModel.findOne<DeprecatedEventAttributes>({
        id: event.id,
      })
      expect(stored?.deleted_by_admin).toBe(true)
      expect(stored?.deleted_reason).toBe("Against the rules")

      expect(notifyDeletedEvent).toHaveBeenCalledTimes(1)
      expect(sendEventDeleted).toHaveBeenCalledTimes(1)

      // The deleted event is no longer publicly listed.
      const publicList = await supertest(app).get("/api/events").expect(200)
      expect(
        publicList.body.data.map((e: { id: string }) => e.id)
      ).not.toContain(event.id)
    })
  })
})
