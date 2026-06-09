import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"

import { deleteEvent } from "./deleteEvent"
import { sendEventDeleted } from "../../Notifications"
import { getAuthProfileSettings } from "../../ProfileSettings/routes/getAuthProfileSettings"
import { canEditAnyEvent } from "../../ProfileSettings/utils"
import { notifyDeletedEvent } from "../../Slack/utils"
import EventModel from "../model"
import { DeprecatedEventAttributes } from "../types"

jest.mock("decentraland-gatsby/dist/entities/Auth/isAdmin", () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock("./getEvent", () => ({
  validateGetEventParams: (params: { event_id: string }) => params,
}))
jest.mock("../model")
jest.mock("../../Notifications", () => ({
  sendEventDeleted: jest.fn(),
}))
jest.mock("../../Slack/utils", () => ({
  notifyDeletedEvent: jest.fn(),
}))
jest.mock("../../ProfileSettings/routes/getAuthProfileSettings")
jest.mock("../../ProfileSettings/utils", () => ({
  canEditAnyEvent: jest.fn(),
}))

const OWNER_ADDRESS = "0x1111111111111111111111111111111111111111"
const OTHER_USER_ADDRESS = "0x2222222222222222222222222222222222222222"
const ADMIN_ADDRESS = "0x3333333333333333333333333333333333333333"
const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000"

function createEvent(
  overrides: Partial<DeprecatedEventAttributes> = {}
): DeprecatedEventAttributes {
  return {
    id: EVENT_ID,
    name: "My Hangout",
    description: "A hangout",
    image: "https://example.com/image.jpg",
    user: OWNER_ADDRESS,
    approved: true,
    rejected: false,
    deleted_by_user: false,
    deleted_by_admin: false,
    deleted_by: null,
    deleted_at: null,
    deleted_reason: null,
    ...overrides,
  } as DeprecatedEventAttributes
}

function createRequest(
  user: string,
  body: Record<string, unknown> = {}
): WithAuth {
  return {
    auth: user,
    params: { event_id: EVENT_ID },
    body,
  } as unknown as WithAuth
}

describe("deleteEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(EventModel.build as jest.Mock).mockImplementation((event) => event)
    ;(EventModel.update as jest.Mock).mockResolvedValue(undefined)
    ;(EventModel.toPublic as jest.Mock).mockImplementation((event) => event)
    ;(getAuthProfileSettings as jest.Mock).mockResolvedValue({
      user: OWNER_ADDRESS,
    })
    ;(isAdmin as unknown as jest.Mock).mockReturnValue(false)
    ;(canEditAnyEvent as jest.Mock).mockReturnValue(false)
  })

  describe("when the owner deletes their own event", () => {
    beforeEach(() => {
      ;(EventModel.findOne as jest.Mock).mockResolvedValue(createEvent())
    })

    it("marks it as deleted_by_user without notifying", async () => {
      await deleteEvent(createRequest(OWNER_ADDRESS))

      const changes = (EventModel.update as jest.Mock).mock.calls[0][0]
      expect(changes.deleted_by_user).toBe(true)
      expect(changes.deleted_by_admin).toBeUndefined()
      expect(changes.deleted_by).toBe(OWNER_ADDRESS)
      expect(changes.deleted_at).toBeInstanceOf(Date)
      expect(notifyDeletedEvent).not.toHaveBeenCalled()
      expect(sendEventDeleted).not.toHaveBeenCalled()
    })
  })

  describe("when a non-owner without permission tries to delete", () => {
    beforeEach(() => {
      ;(EventModel.findOne as jest.Mock).mockResolvedValue(createEvent())
    })

    it("throws Forbidden", async () => {
      await expect(
        deleteEvent(createRequest(OTHER_USER_ADDRESS))
      ).rejects.toThrow("You don't have permission to delete this event")
      expect(EventModel.update).not.toHaveBeenCalled()
    })
  })

  describe("when an admin deletes someone else's event", () => {
    beforeEach(() => {
      ;(EventModel.findOne as jest.Mock).mockResolvedValue(createEvent())
      ;(isAdmin as unknown as jest.Mock).mockReturnValue(true)
    })

    it("marks it as deleted_by_admin and notifies the creator", async () => {
      await deleteEvent(
        createRequest(ADMIN_ADDRESS, { reason: "Against the rules" })
      )

      const changes = (EventModel.update as jest.Mock).mock.calls[0][0]
      expect(changes.deleted_by_admin).toBe(true)
      expect(changes.deleted_by_user).toBeUndefined()
      expect(changes.deleted_by).toBe(ADMIN_ADDRESS)
      expect(changes.deleted_reason).toBe("Against the rules")
      expect(notifyDeletedEvent).toHaveBeenCalledTimes(1)
      expect(sendEventDeleted).toHaveBeenCalledTimes(1)
    })
  })

  describe("when the event is already deleted", () => {
    beforeEach(() => {
      ;(EventModel.findOne as jest.Mock).mockResolvedValue(
        createEvent({ deleted_by_user: true, deleted_by: OWNER_ADDRESS })
      )
    })

    it("responds idempotently without persisting or notifying", async () => {
      await deleteEvent(createRequest(OWNER_ADDRESS))

      expect(EventModel.update).not.toHaveBeenCalled()
      expect(notifyDeletedEvent).not.toHaveBeenCalled()
      expect(sendEventDeleted).not.toHaveBeenCalled()
    })
  })
})
