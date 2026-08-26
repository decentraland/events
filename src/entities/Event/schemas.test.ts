import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"

import {
  getEventListByPlacesBodySchema,
  getEventListQuery,
  newEventSchema,
} from "./schemas"
import { EventListParams } from "./types"

const validateQuery = createValidator<EventListParams>(getEventListQuery)

type PlacesBody = { placeIds?: string[]; communityId?: string }
const validateBody = createValidator<PlacesBody>(getEventListByPlacesBodySchema)

const validateNewEvent = createValidator<Record<string, unknown>>(
  newEventSchema as any
)

function validNewEventBase() {
  return {
    name: "Test Event",
    start_at: new Date("2030-01-01T00:00:00Z").toJSON(),
    duration: 60 * 60 * 1000,
    x: 0,
    y: 0,
  }
}

describe("getEventListQuery schema", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when places_ids contains UUID-format IDs", () => {
    let query: Record<string, unknown>

    beforeEach(() => {
      query = {
        places_ids: ["550e8400-e29b-41d4-a716-446655440000"],
      }
    })

    it("should accept the input without throwing", () => {
      expect(() => validateQuery(query)).not.toThrow()
    })
  })

  describe("when places_ids contains world-name-format IDs", () => {
    let query: Record<string, unknown>

    beforeEach(() => {
      query = { places_ids: ["myworld.dcl.eth"] }
    })

    it("should accept the input without throwing", () => {
      expect(() => validateQuery(query)).not.toThrow()
    })
  })

  describe("when places_ids contains mixed UUID and world-name IDs", () => {
    let query: Record<string, unknown>

    beforeEach(() => {
      query = {
        places_ids: ["550e8400-e29b-41d4-a716-446655440000", "myworld.dcl.eth"],
      }
    })

    it("should accept the input without throwing", () => {
      expect(() => validateQuery(query)).not.toThrow()
    })
  })

  describe("when places_ids contains an empty string", () => {
    let query: Record<string, unknown>

    beforeEach(() => {
      query = { places_ids: [""] }
    })

    it("should throw a RequestError", () => {
      expect(() => validateQuery(query)).toThrow(RequestError)
    })
  })

  describe("when places_ids exceeds maxItems of 100", () => {
    let query: Record<string, unknown>

    beforeEach(() => {
      query = {
        places_ids: Array.from({ length: 101 }, (_, i) => `world${i}.dcl.eth`),
      }
    })

    it("should throw a RequestError", () => {
      expect(() => validateQuery(query)).toThrow(RequestError)
    })
  })

  describe("when list is the deprecated `highlight` alias", () => {
    it("should accept the value for backward compatibility", () => {
      expect(() => validateQuery({ list: "highlight" })).not.toThrow()
    })
  })

  describe("when highlighted is a truthy string", () => {
    it("should accept `true`", () => {
      expect(() => validateQuery({ highlighted: "true" })).not.toThrow()
    })
  })
})

describe("getEventListByPlacesBodySchema", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when placeIds contains UUID-format IDs", () => {
    let body: Record<string, unknown>

    beforeEach(() => {
      body = {
        placeIds: ["550e8400-e29b-41d4-a716-446655440000"],
      }
    })

    it("should accept the input without throwing", () => {
      expect(() => validateBody(body)).not.toThrow()
    })
  })

  describe("when placeIds contains world-name-format IDs", () => {
    let body: Record<string, unknown>

    beforeEach(() => {
      body = { placeIds: ["myworld.dcl.eth"] }
    })

    it("should accept the input without throwing", () => {
      expect(() => validateBody(body)).not.toThrow()
    })
  })

  describe("when placeIds contains mixed UUID and world-name IDs", () => {
    let body: Record<string, unknown>

    beforeEach(() => {
      body = {
        placeIds: ["550e8400-e29b-41d4-a716-446655440000", "myworld.dcl.eth"],
      }
    })

    it("should accept the input without throwing", () => {
      expect(() => validateBody(body)).not.toThrow()
    })
  })

  describe("when placeIds contains an empty string", () => {
    let body: Record<string, unknown>

    beforeEach(() => {
      body = { placeIds: [""] }
    })

    it("should throw a RequestError", () => {
      expect(() => validateBody(body)).toThrow(RequestError)
    })
  })

  describe("when placeIds exceeds maxItems of 100", () => {
    let body: Record<string, unknown>

    beforeEach(() => {
      body = {
        placeIds: Array.from({ length: 101 }, (_, i) => `world${i}.dcl.eth`),
      }
    })

    it("should throw a RequestError", () => {
      expect(() => validateBody(body)).toThrow(RequestError)
    })
  })
})

describe("newEventSchema", () => {
  describe.each([
    ["url", "javascript:alert(1)"],
    ["image", "data:image/svg+xml,<svg/>"],
    ["image_vertical", "file:///etc/passwd"],
  ])("when %s uses an unsafe URI scheme", (field, value) => {
    let body: Record<string, unknown>

    beforeEach(() => {
      body = {
        ...validNewEventBase(),
        [field]: value,
      }
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it("should throw a RequestError", () => {
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when recurrent_frequency is one of the allowed values", () => {
    it.each(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])(
      "should accept %s",
      (freq) => {
        const body = {
          ...validNewEventBase(),
          recurrent: true,
          recurrent_frequency: freq,
          recurrent_count: 5,
        }
        expect(() => validateNewEvent(body)).not.toThrow()
      }
    )
  })

  describe("when recurrent_frequency is MINUTELY", () => {
    it("should throw a RequestError", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "MINUTELY",
        recurrent_count: 5,
      }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when recurrent_frequency is SECONDLY", () => {
    it("should throw a RequestError", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "SECONDLY",
        recurrent_count: 5,
      }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when recurrent_interval exceeds the maximum", () => {
    it("should throw a RequestError", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "DAILY",
        recurrent_interval: 1001,
        recurrent_count: 5,
      }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when recurrent_count exceeds the maximum", () => {
    it("should throw a RequestError", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "DAILY",
        recurrent_count: 1001,
      }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when recurrent_interval is at the boundary (1000)", () => {
    it("should accept the input", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "DAILY",
        recurrent_interval: 1000,
        recurrent_count: 5,
      }
      expect(() => validateNewEvent(body)).not.toThrow()
    })
  })

  describe("when recurrent_count is at the boundary (1000)", () => {
    it("should accept the input", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "DAILY",
        recurrent_count: 1000,
      }
      expect(() => validateNewEvent(body)).not.toThrow()
    })
  })

  describe("when recurrent_count is fractional", () => {
    it("should throw a RequestError", () => {
      // A fractional count would never hit rrule's integer count check
      // (count decrements from 0.5 to -0.5 to ...), letting iteration
      // run until MAXYEAR. Must be rejected.
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "DAILY",
        recurrent_count: 0.5,
      }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when recurrent_interval is fractional", () => {
    it("should throw a RequestError", () => {
      const body = {
        ...validNewEventBase(),
        recurrent: true,
        recurrent_frequency: "DAILY",
        recurrent_interval: 1.5,
        recurrent_count: 5,
      }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })

  describe("when featured_item is a valid collections-v2 URN", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678"

    it.each([
      ["matic item", `urn:decentraland:matic:collections-v2:${address}:1`],
      ["matic collection", `urn:decentraland:matic:collections-v2:${address}`],
      [
        "ethereum item",
        `urn:decentraland:ethereum:collections-v2:${address}:42`,
      ],
      ["amoy item", `urn:decentraland:amoy:collections-v2:${address}:0`],
      [
        "sepolia collection",
        `urn:decentraland:sepolia:collections-v2:${address}`,
      ],
      [
        "mixed-case hex address",
        "urn:decentraland:matic:collections-v2:0xAbCdEf1234567890ABCDEF1234567890abcdef12:7",
      ],
    ])("should accept %s", (_label, value) => {
      const body = { ...validNewEventBase(), featured_item: value }
      expect(() => validateNewEvent(body)).not.toThrow()
    })

    it("should accept null", () => {
      const body = { ...validNewEventBase(), featured_item: null }
      expect(() => validateNewEvent(body)).not.toThrow()
    })
  })

  describe("when featured_item is not a valid collections-v2 URN", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678"

    it.each([
      [
        "unsupported chain",
        `urn:decentraland:mainnet:collections-v2:${address}:1`,
      ],
      ["collections-v1", `urn:decentraland:matic:collections-v1:${address}:1`],
      [
        "39-char address",
        "urn:decentraland:matic:collections-v2:0x1234567890abcdef1234567890abcdef1234567:1",
      ],
      [
        "41-char address",
        "urn:decentraland:matic:collections-v2:0x1234567890abcdef1234567890abcdef123456789:1",
      ],
      [
        "non-hex address",
        "urn:decentraland:matic:collections-v2:0x1234567890abcdef1234567890abcdef1234567g:1",
      ],
      ["extra segment", `urn:decentraland:matic:collections-v2:${address}:1:2`],
      [
        "non-numeric token id",
        `urn:decentraland:matic:collections-v2:${address}:abc`,
      ],
      ["missing urn prefix", `decentraland:matic:collections-v2:${address}:1`],
      ["plain text", "my favourite wearable"],
      ["empty string", ""],
      [
        "longer than 160 chars",
        `urn:decentraland:matic:collections-v2:${address}:${"1".repeat(130)}`,
      ],
    ])("should reject %s", (_label, value) => {
      const body = { ...validNewEventBase(), featured_item: value }
      expect(() => validateNewEvent(body)).toThrow(RequestError)
    })
  })
})
