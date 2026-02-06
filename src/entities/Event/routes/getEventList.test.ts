import {
  ConnectedUsersMap,
  addConnectedUsersToEvents,
  fetchConnectedUsersForEvents,
} from "./getEventList"
import CommsGatekeeper from "../../../api/CommsGatekeeper"

// Test type representing simplified event attributes
type TestEvent = {
  id: string
  name: string
  x: number
  y: number
  world: boolean
  server: string | null
}

// Mock the CommsGatekeeper
jest.mock("../../../api/CommsGatekeeper")

const mockCommsGatekeeper = {
  getSceneParticipants: jest.fn(),
  getWorldParticipants: jest.fn(),
}

beforeEach(() => {
  ;(CommsGatekeeper.get as jest.Mock).mockReturnValue(mockCommsGatekeeper)
  mockCommsGatekeeper.getSceneParticipants.mockReset()
  mockCommsGatekeeper.getWorldParticipants.mockReset()
})

describe("fetchConnectedUsersForEvents", () => {
  describe("when events include places (Genesis City)", () => {
    it("should fetch scene participants for each unique position", async () => {
      const events: TestEvent[] = [
        { id: "1", name: "Event 1", x: 10, y: 20, world: false, server: null },
        { id: "2", name: "Event 2", x: 30, y: 40, world: false, server: null },
      ]

      mockCommsGatekeeper.getSceneParticipants
        .mockResolvedValueOnce(["0x123", "0x456"])
        .mockResolvedValueOnce(["0x789"])

      const result = await fetchConnectedUsersForEvents(events as any)

      expect(mockCommsGatekeeper.getSceneParticipants).toHaveBeenCalledTimes(2)
      expect(mockCommsGatekeeper.getSceneParticipants).toHaveBeenCalledWith(
        "10,20"
      )
      expect(mockCommsGatekeeper.getSceneParticipants).toHaveBeenCalledWith(
        "30,40"
      )

      expect(result.get("10,20")).toEqual(["0x123", "0x456"])
      expect(result.get("30,40")).toEqual(["0x789"])
    })

    it("should deduplicate positions for multiple events at same location", async () => {
      const events: TestEvent[] = [
        { id: "1", name: "Event 1", x: 10, y: 20, world: false, server: null },
        { id: "2", name: "Event 2", x: 10, y: 20, world: false, server: null },
      ]

      mockCommsGatekeeper.getSceneParticipants.mockResolvedValueOnce([
        "0x123",
        "0x456",
      ])

      await fetchConnectedUsersForEvents(events as any)

      expect(mockCommsGatekeeper.getSceneParticipants).toHaveBeenCalledTimes(1)
      expect(mockCommsGatekeeper.getSceneParticipants).toHaveBeenCalledWith(
        "10,20"
      )
    })
  })

  describe("when events include worlds", () => {
    it("should fetch world participants for each unique world name", async () => {
      const events: TestEvent[] = [
        {
          id: "1",
          name: "World Event 1",
          x: 0,
          y: 0,
          world: true,
          server: "myworld.dcl.eth",
        },
        {
          id: "2",
          name: "World Event 2",
          x: 0,
          y: 0,
          world: true,
          server: "anotherworld.dcl.eth",
        },
      ]

      mockCommsGatekeeper.getWorldParticipants
        .mockResolvedValueOnce(["0xabc"])
        .mockResolvedValueOnce(["0xdef", "0xghi"])

      const result = await fetchConnectedUsersForEvents(events as any)

      expect(mockCommsGatekeeper.getWorldParticipants).toHaveBeenCalledTimes(2)
      expect(mockCommsGatekeeper.getWorldParticipants).toHaveBeenCalledWith(
        "myworld.dcl.eth"
      )
      expect(mockCommsGatekeeper.getWorldParticipants).toHaveBeenCalledWith(
        "anotherworld.dcl.eth"
      )

      expect(result.get("myworld.dcl.eth")).toEqual(["0xabc"])
      expect(result.get("anotherworld.dcl.eth")).toEqual(["0xdef", "0xghi"])
    })

    it("should deduplicate world names for multiple events in same world", async () => {
      const events: TestEvent[] = [
        {
          id: "1",
          name: "World Event 1",
          x: 0,
          y: 0,
          world: true,
          server: "myworld.dcl.eth",
        },
        {
          id: "2",
          name: "World Event 2",
          x: 0,
          y: 0,
          world: true,
          server: "myworld.dcl.eth",
        },
      ]

      mockCommsGatekeeper.getWorldParticipants.mockResolvedValueOnce(["0xabc"])

      await fetchConnectedUsersForEvents(events as any)

      expect(mockCommsGatekeeper.getWorldParticipants).toHaveBeenCalledTimes(1)
      expect(mockCommsGatekeeper.getWorldParticipants).toHaveBeenCalledWith(
        "myworld.dcl.eth"
      )
    })
  })

  describe("when events include both places and worlds", () => {
    it("should fetch participants for both types", async () => {
      const events: TestEvent[] = [
        {
          id: "1",
          name: "Place Event",
          x: 10,
          y: 20,
          world: false,
          server: null,
        },
        {
          id: "2",
          name: "World Event",
          x: 0,
          y: 0,
          world: true,
          server: "myworld.dcl.eth",
        },
      ]

      mockCommsGatekeeper.getSceneParticipants.mockResolvedValueOnce(["0x123"])
      mockCommsGatekeeper.getWorldParticipants.mockResolvedValueOnce(["0xabc"])

      const result = await fetchConnectedUsersForEvents(events as any)

      expect(mockCommsGatekeeper.getSceneParticipants).toHaveBeenCalledTimes(1)
      expect(mockCommsGatekeeper.getWorldParticipants).toHaveBeenCalledTimes(1)

      expect(result.get("10,20")).toEqual(["0x123"])
      expect(result.get("myworld.dcl.eth")).toEqual(["0xabc"])
    })
  })

  describe("when API calls fail", () => {
    it("should return empty array for failed requests", async () => {
      const events: TestEvent[] = [
        { id: "1", name: "Event 1", x: 10, y: 20, world: false, server: null },
      ]

      mockCommsGatekeeper.getSceneParticipants.mockRejectedValueOnce(
        new Error("API Error")
      )

      const result = await fetchConnectedUsersForEvents(events as any)

      expect(result.get("10,20")).toEqual([])
    })
  })
})

describe("addConnectedUsersToEvents", () => {
  it("should add connected_addresses to place events", () => {
    const events: TestEvent[] = [
      { id: "1", name: "Event 1", x: 10, y: 20, world: false, server: null },
    ]

    const connectedUsersMap: ConnectedUsersMap = new Map([
      ["10,20", ["0x123", "0x456"]],
    ])

    const result = addConnectedUsersToEvents(events as any, connectedUsersMap)

    expect(result[0].connected_addresses).toEqual(["0x123", "0x456"])
  })

  it("should add connected_addresses to world events", () => {
    const events: TestEvent[] = [
      {
        id: "1",
        name: "World Event",
        x: 0,
        y: 0,
        world: true,
        server: "myworld.dcl.eth",
      },
    ]

    const connectedUsersMap: ConnectedUsersMap = new Map([
      ["myworld.dcl.eth", ["0xabc", "0xdef"]],
    ])

    const result = addConnectedUsersToEvents(events as any, connectedUsersMap)

    expect(result[0].connected_addresses).toEqual(["0xabc", "0xdef"])
  })

  it("should return empty array when no participants found", () => {
    const events: TestEvent[] = [
      { id: "1", name: "Event 1", x: 10, y: 20, world: false, server: null },
    ]

    const connectedUsersMap: ConnectedUsersMap = new Map()

    const result = addConnectedUsersToEvents(events as any, connectedUsersMap)

    expect(result[0].connected_addresses).toEqual([])
  })

  it("should preserve all original event properties", () => {
    const events: TestEvent[] = [
      { id: "1", name: "Event 1", x: 10, y: 20, world: false, server: null },
    ]

    const connectedUsersMap: ConnectedUsersMap = new Map([["10,20", ["0x123"]]])

    const result = addConnectedUsersToEvents(events as any, connectedUsersMap)

    expect(result[0].id).toBe("1")
    expect(result[0].name).toBe("Event 1")
    expect(result[0].x).toBe(10)
    expect(result[0].y).toBe(20)
    expect(result[0].connected_addresses).toEqual(["0x123"])
  })
})
