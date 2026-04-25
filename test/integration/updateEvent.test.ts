import { AuthIdentity } from "@dcl/crypto/dist/types"
import supertest from "supertest"

import { signedHeaderFactory } from "decentraland-crypto-fetch"

import EventModel from "../../src/entities/Event/model"
import { DeprecatedEventAttributes } from "../../src/entities/Event/types"
import { ProfilePermissions } from "../../src/entities/ProfileSettings/types"
import { seedEvent } from "../mocks/event"
import { createIdentity } from "../mocks/identity"
import { seedProfileSettings } from "../mocks/profileSettings"
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

const app = createTestApp()
const ADMIN_TOKEN = "integration-events-admin-token"
const ACTOR = "jarvis-agent"
let dbInitialized = false

function signedPatch(
  identity: AuthIdentity,
  path: string,
  body: Record<string, unknown>
) {
  const createHeaders = signedHeaderFactory()
  const headers = createHeaders(identity, "PATCH", path, {})

  const headerObj: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    headerObj[key] = value
  })

  return supertest(app).patch(path).set(headerObj).send(body)
}

function adminRequest(request: supertest.Test): supertest.Test {
  return request.set("Authorization", `Bearer ${ADMIN_TOKEN}`)
}

describe("PATCH /api/events/:event_id", () => {
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
    let event: DeprecatedEventAttributes

    beforeEach(async () => {
      const owner = await createIdentity()
      event = await seedEvent({ user: owner.address })
    })

    it("should respond with 401 Unauthorized", async () => {
      const response = await supertest(app)
        .patch(`/api/events/${event.id}`)
        .send({ name: "No Auth" })

      expect(response.status).toBe(401)
    })
  })

  describe("when the event does not exist", () => {
    let attackerIdentity: AuthIdentity

    beforeEach(async () => {
      const attacker = await createIdentity()
      attackerIdentity = attacker.identity
    })

    it("should respond with 404 Not Found", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000"
      const response = await signedPatch(
        attackerIdentity,
        `/api/events/${nonExistentId}`,
        { name: "Ghost Event" }
      )

      expect(response.status).toBe(404)
    })
  })

  describe("when the caller is not the event owner", () => {
    describe("and has no special permissions", () => {
      let event: DeprecatedEventAttributes
      let attackerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        const attacker = await createIdentity()
        attackerIdentity = attacker.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 403 Forbidden", async () => {
        const response = await signedPatch(
          attackerIdentity,
          `/api/events/${event.id}`,
          { name: "Hacked Name" }
        )

        expect(response.status).toBe(403)
      })

      it("should not modify the event in the database", async () => {
        await signedPatch(attackerIdentity, `/api/events/${event.id}`, {
          name: "Hacked Name",
        })

        const response = await supertest(app)
          .get(`/api/events/${event.id}`)
          .expect(200)

        expect(response.body.data.name).toBe("Test Event")
      })
    })

    describe("and tries to reject the event", () => {
      let event: DeprecatedEventAttributes
      let attackerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        const attacker = await createIdentity()
        attackerIdentity = attacker.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 403 Forbidden", async () => {
        const response = await signedPatch(
          attackerIdentity,
          `/api/events/${event.id}`,
          { rejected: true }
        )

        expect(response.status).toBe(403)
      })

      it("should not reject the event in the database", async () => {
        await signedPatch(attackerIdentity, `/api/events/${event.id}`, {
          rejected: true,
        })

        const response = await supertest(app)
          .get(`/api/events/${event.id}`)
          .expect(200)

        expect(response.body.data.rejected).toBe(false)
      })
    })

    describe("and tries to change the event image and coordinates", () => {
      let event: DeprecatedEventAttributes
      let attackerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        const attacker = await createIdentity()
        attackerIdentity = attacker.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 403 Forbidden", async () => {
        const response = await signedPatch(
          attackerIdentity,
          `/api/events/${event.id}`,
          { image: "https://attacker.com/phishing.png", x: 999, y: 999 }
        )

        expect(response.status).toBe(403)
      })
    })

    describe("and has the EditAnyEvent permission", () => {
      let event: DeprecatedEventAttributes
      let editorIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        const editor = await createIdentity()
        editorIdentity = editor.identity
        event = await seedEvent({ user: owner.address, approved: false })
        await seedProfileSettings(editor.address, [
          ProfilePermissions.EditAnyEvent,
        ])
      })

      it("should respond with 201 and the updated event", async () => {
        const response = await signedPatch(
          editorIdentity,
          `/api/events/${event.id}`,
          { name: "Editor Updated Name" }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.name).toBe("Editor Updated Name")
      })

      it("should not be able to approve the event without ApproveAnyEvent permission", async () => {
        const response = await signedPatch(
          editorIdentity,
          `/api/events/${event.id}`,
          { approved: true, name: "Still Updated" }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.name).toBe("Still Updated")
        expect(response.body.data.approved).toBe(false)
      })
    })

    describe("and has the ApproveAnyEvent permission", () => {
      let event: DeprecatedEventAttributes
      let approverIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        const approver = await createIdentity()
        approverIdentity = approver.identity
        event = await seedEvent({ user: owner.address, approved: false })
        await seedProfileSettings(approver.address, [
          ProfilePermissions.ApproveAnyEvent,
          ProfilePermissions.EditAnyEvent,
        ])
      })

      it("should be able to approve the event", async () => {
        const response = await signedPatch(
          approverIdentity,
          `/api/events/${event.id}`,
          { approved: true }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.approved).toBe(true)
      })
    })
  })

  describe("when the caller is the event owner", () => {
    describe("and updates basic fields", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 201 and the updated event", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { name: "Updated Name", description: "Updated description" }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.name).toBe("Updated Name")
        expect(response.body.data.description).toBe("Updated description")
      })

      it("should persist the changes to the database", async () => {
        await signedPatch(ownerIdentity, `/api/events/${event.id}`, {
          name: "Persisted Name",
        }).expect(201)

        const response = await supertest(app)
          .get(`/api/events/${event.id}`)
          .expect(200)

        expect(response.body.data.name).toBe("Persisted Name")
      })
    })

    describe("and updates owner-only fields", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 201 and include the owner-only fields", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { contact: "owner@test.com", details: "VIP details" }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.contact).toBe("owner@test.com")
        expect(response.body.data.details).toBe("VIP details")
      })

      it("should not expose owner-only fields to other users via GET", async () => {
        await signedPatch(ownerIdentity, `/api/events/${event.id}`, {
          contact: "secret@test.com",
          details: "Secret details",
        }).expect(201)

        const response = await supertest(app)
          .get(`/api/events/${event.id}`)
          .expect(200)

        expect(response.body.data.contact).toBeUndefined()
        expect(response.body.data.details).toBeUndefined()
      })
    })

    describe("and tries to self-approve without permission", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address, approved: false })
      })

      it("should update other fields but not change the approved status", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { approved: true, name: "Updated Name" }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.name).toBe("Updated Name")
        expect(response.body.data.approved).toBe(false)
      })
    })

    describe("and has the ApproveOwnEvent permission", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address, approved: false })
        await seedProfileSettings(owner.address, [
          ProfilePermissions.ApproveOwnEvent,
        ])
      })

      it("should be able to self-approve the event", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { approved: true }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.approved).toBe(true)
      })
    })

    describe("and rejects their own event", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({
          user: owner.address,
          approved: true,
          highlighted: true,
          trending: true,
        })
      })

      it("should set approved, highlighted, and trending to false", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { rejected: true }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.rejected).toBe(true)
        expect(response.body.data.approved).toBe(false)
        expect(response.body.data.highlighted).toBe(false)
        expect(response.body.data.trending).toBe(false)
      })

      it("should hide the event from public listings", async () => {
        await signedPatch(ownerIdentity, `/api/events/${event.id}`, {
          rejected: true,
        }).expect(201)

        const response = await supertest(app).get("/api/events").expect(200)

        const eventIds = response.body.data.map(
          (e: DeprecatedEventAttributes) => e.id
        )
        expect(eventIds).not.toContain(event.id)
      })
    })

    describe("and sets a duration exceeding the maximum", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 400 Bad Request", async () => {
        const oneDayPlusOne = 24 * 60 * 60 * 1000 + 1
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { duration: oneDayPlusOne }
        )

        expect(response.status).toBe(400)
      })
    })

    describe("and sets coordinates outside the world limits", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 400 Bad Request", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { x: 9999, y: 9999 }
        )

        expect(response.status).toBe(400)
      })
    })

    describe("and sets a valid category", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 201 and include the category", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { categories: ["music"] }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.categories).toEqual(["music"])
      })
    })

    describe("and sets an invalid category", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should respond with 400 Bad Request", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { categories: ["nonexistent_category"] }
        )

        expect(response.status).toBe(400)
      })
    })

    describe("and updates the event timing", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should update start_at and recalculate next_start_at", async () => {
        const newStartAt = new Date("2031-06-15T18:00:00Z")
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { start_at: newStartAt.toISOString() }
        )

        expect(response.status).toBe(201)
        expect(new Date(response.body.data.next_start_at).getTime()).toBe(
          newStartAt.getTime()
        )
      })
    })

    describe("and changes the event location", () => {
      let event: DeprecatedEventAttributes
      let ownerIdentity: AuthIdentity

      beforeEach(async () => {
        const owner = await createIdentity()
        ownerIdentity = owner.identity
        event = await seedEvent({ user: owner.address })
      })

      it("should update coordinates and position", async () => {
        const response = await signedPatch(
          ownerIdentity,
          `/api/events/${event.id}`,
          { x: 50, y: -30 }
        )

        expect(response.status).toBe(201)
        expect(response.body.data.x).toBe(50)
        expect(response.body.data.y).toBe(-30)
        expect(response.body.data.position).toEqual([50, -30])
      })
    })
  })

  describe("when the request uses the admin bearer token", () => {
    describe("and approves an event", () => {
      let event: DeprecatedEventAttributes
      let response: supertest.Response
      let storedEvent: DeprecatedEventAttributes | null

      beforeEach(async () => {
        event = await seedEvent({
          approved: false,
          rejected: true,
          rejected_by: "previous-admin",
          rejection_reason: "Previous reason",
        })
        response = await adminRequest(
          supertest(app).patch(`/api/events/${event.id}`).send({
            approved: true,
          })
        )
        storedEvent = await EventModel.findOne<DeprecatedEventAttributes>({
          id: event.id,
        })
      })

      it("should approve the event and clear rejection state", async () => {
        expect(response.status).toBe(201)
        expect(response.body.data.approved).toBe(true)
        expect(response.body.data.approved_by).toBe(ACTOR)
        expect(response.body.data.rejected).toBe(false)
        expect(response.body.data.rejection_reason).toBeNull()
        expect(storedEvent?.approved).toBe(true)
        expect(storedEvent?.approved_by?.trim()).toBe(ACTOR)
        expect(storedEvent?.rejected).toBe(false)
        expect(storedEvent?.rejection_reason).toBeNull()
      })
    })

    describe("and rejects an event", () => {
      let event: DeprecatedEventAttributes
      let response: supertest.Response
      let storedEvent: DeprecatedEventAttributes | null

      beforeEach(async () => {
        event = await seedEvent({
          approved: true,
          highlighted: true,
          rejected: false,
          trending: true,
        })
        response = await adminRequest(
          supertest(app).patch(`/api/events/${event.id}`).send({
            rejected: true,
            reason: "Invalid content",
          })
        )
        storedEvent = await EventModel.findOne<DeprecatedEventAttributes>({
          id: event.id,
        })
      })

      it("should reject the event and store the rejection reason", async () => {
        expect(response.status).toBe(201)
        expect(response.body.data.approved).toBe(false)
        expect(response.body.data.highlighted).toBe(false)
        expect(response.body.data.rejected).toBe(true)
        expect(response.body.data.rejected_by).toBe(ACTOR)
        expect(response.body.data.rejection_reason).toBe("Invalid content")
        expect(response.body.data.trending).toBe(false)
        expect(storedEvent?.approved).toBe(false)
        expect(storedEvent?.highlighted).toBe(false)
        expect(storedEvent?.rejected).toBe(true)
        expect(storedEvent?.rejected_by?.trim()).toBe(ACTOR)
        expect(storedEvent?.rejection_reason).toBe("Invalid content")
        expect(storedEvent?.trending).toBe(false)
      })
    })

    describe("and edits event fields", () => {
      let event: DeprecatedEventAttributes
      let response: supertest.Response
      let storedEvent: DeprecatedEventAttributes | null

      beforeEach(async () => {
        event = await seedEvent({
          approved: true,
          name: "Original Name",
          x: 0,
          y: 0,
        })
        response = await adminRequest(
          supertest(app).patch(`/api/events/${event.id}`).send({
            name: "Admin Updated Name",
            x: 10,
            y: -10,
          })
        )
        storedEvent = await EventModel.findOne<DeprecatedEventAttributes>({
          id: event.id,
        })
      })

      it("should reuse the update pipeline and persist the edit", async () => {
        expect(response.status).toBe(201)
        expect(response.body.data.name).toBe("Admin Updated Name")
        expect(response.body.data.position).toEqual([10, -10])
        expect(storedEvent?.name).toBe("Admin Updated Name")
        expect(storedEvent?.x).toBe(10)
        expect(storedEvent?.y).toBe(-10)
        expect(storedEvent?.coordinates).toEqual([10, -10])
      })
    })

    describe("and the bearer token is invalid", () => {
      let event: DeprecatedEventAttributes
      let response: supertest.Response

      beforeEach(async () => {
        event = await seedEvent({ approved: true })
        response = await supertest(app)
          .patch(`/api/events/${event.id}`)
          .set("Authorization", "Bearer invalid-token")
          .send({ approved: true })
      })

      it("should respond with 401 Unauthorized", async () => {
        expect(response.status).toBe(401)
      })
    })
  })
})
