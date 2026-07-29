import RequestError from "decentraland-gatsby/dist/entities/Route/error"

import { validatePosterContentType } from "./routes"

jest.mock("decentraland-gatsby/dist/utils/env", () => ({
  __esModule: true,
  default: (_name: string, fallback?: string) => fallback,
  requiredEnv: (_name: string, fallback?: string) => fallback,
}))

describe("poster content validation", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when a PNG payload declares the PNG MIME type", () => {
    let data: Buffer
    let allowedMimeTypes: string[]

    beforeEach(() => {
      data = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ])
      allowedMimeTypes = ["image/png"]
    })

    it("should return the detected MIME type", async () => {
      await expect(
        validatePosterContentType(data, "image/png", allowedMimeTypes)
      ).resolves.toBe("image/png")
    })
  })

  describe("when arbitrary bytes declare an allowed MIME type", () => {
    let data: Buffer
    let allowedMimeTypes: string[]

    beforeEach(() => {
      data = Buffer.from("<script>alert(1)</script>")
      allowedMimeTypes = ["image/png", "image/jpeg"]
    })

    it("should reject the payload", async () => {
      await expect(
        validatePosterContentType(data, "image/png", allowedMimeTypes)
      ).rejects.toThrow(RequestError)
    })
  })

  describe("when the declared MIME type differs from the detected type", () => {
    let data: Buffer
    let allowedMimeTypes: string[]

    beforeEach(() => {
      data = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ])
      allowedMimeTypes = ["image/png", "image/jpeg"]
    })

    it("should reject the payload", async () => {
      await expect(
        validatePosterContentType(data, "image/jpeg", allowedMimeTypes)
      ).rejects.toThrow(RequestError)
    })
  })
})
