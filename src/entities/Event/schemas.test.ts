import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"

import {
  getEventListByPlacesBodySchema,
  getEventListQuery,
} from "./schemas"
import { EventListParams } from "./types"

const validateQuery = createValidator<EventListParams>(getEventListQuery)

type PlacesBody = { placeIds?: string[]; communityId?: string }
const validateBody = createValidator<PlacesBody>(
  getEventListByPlacesBodySchema
)

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
        places_ids: [
          "550e8400-e29b-41d4-a716-446655440000",
          "myworld.dcl.eth",
        ],
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
        places_ids: Array.from(
          { length: 101 },
          (_, i) => `world${i}.dcl.eth`
        ),
      }
    })

    it("should throw a RequestError", () => {
      expect(() => validateQuery(query)).toThrow(RequestError)
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
        placeIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "myworld.dcl.eth",
        ],
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
        placeIds: Array.from(
          { length: 101 },
          (_, i) => `world${i}.dcl.eth`
        ),
      }
    })

    it("should throw a RequestError", () => {
      expect(() => validateBody(body)).toThrow(RequestError)
    })
  })
})
