import RequestError from "decentraland-gatsby/dist/entities/Route/error"

import { validateEventUrl, validateImageUrl } from "./utils"

jest.mock("decentraland-gatsby/dist/utils/env", () => ({
  __esModule: true,
  default: (name: string, fallback?: string) =>
    name === "AWS_BUCKET_URL" ? "https://assets.example.com" : fallback,
}))

describe("event URL validation", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "http://127.0.0.1/admin",
  ])("when the target is %s", (target) => {
    it("should reject the unsafe URL", () => {
      expect(() => validateEventUrl(target)).toThrow(RequestError)
    })
  })

  describe("when the target is a public HTTPS URL", () => {
    let target: string

    beforeEach(() => {
      target = "https://decentraland.org/jump"
    })

    it("should return the URL", () => {
      expect(validateEventUrl(target)).toBe(target)
    })
  })
})

describe("image URL validation", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each([
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "file:///etc/passwd",
    "https://example.com/poster.png",
    "https://assets.example.com.attacker.test/poster.png",
  ])("when the image URL is %s", (imageUrl) => {
    it("should reject the URL", async () => {
      await expect(validateImageUrl(imageUrl)).rejects.toThrow(RequestError)
    })
  })

  describe("when the image URL uses the configured bucket origin", () => {
    let imageUrl: string

    beforeEach(() => {
      imageUrl = "https://assets.example.com/poster.png"
    })

    it("should return the URL", async () => {
      await expect(validateImageUrl(imageUrl)).resolves.toBe(imageUrl)
    })
  })
})
