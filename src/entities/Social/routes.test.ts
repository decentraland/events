import { resolve } from "path"

import { replaceHelmetMetadata } from "decentraland-gatsby/dist/entities/Gatsby/utils"
import { readOnce } from "decentraland-gatsby/dist/entities/Route/routes/file"
import { Request, Response } from "express"

import EventModel from "../Event/model"
import ScheduleModel from "../Schedule/model"
import {
  injectEventMetadata,
  injectScheduleMetadata,
} from "./routes"

jest.mock("decentraland-gatsby/dist/entities/Gatsby/utils")
jest.mock("decentraland-gatsby/dist/entities/Route/routes/file")
jest.mock("../Event/model")
jest.mock("../Schedule/model")

const mockReplaceHelmetMetadata = replaceHelmetMetadata as jest.Mock
const mockReadOnce = readOnce as jest.Mock

describe("injectEventMetadata", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when the request path is a valid path within public", () => {
    let req: Request
    let result: string

    beforeEach(async () => {
      req = {
        path: "/event/",
        query: {},
        originalUrl: "/event/",
      } as unknown as Request
      mockReadOnce.mockResolvedValueOnce(Buffer.from("<html></html>"))
      mockReplaceHelmetMetadata.mockReturnValueOnce("<html>replaced</html>")
      result = await injectEventMetadata(req)
    })

    it("should read the file from the public directory", () => {
      const expectedPath = resolve(
        process.cwd(),
        "./public",
        "./event/",
        "./index.html"
      )
      expect(mockReadOnce).toHaveBeenCalledWith(expectedPath)
    })

    it("should return the page with replaced metadata", () => {
      expect(result).toBe("<html>replaced</html>")
    })
  })

  describe("when the request path contains path traversal segments", () => {
    let req: Request

    beforeEach(() => {
      req = {
        path: "/en/../../../etc/passwd",
        query: {},
        originalUrl: "/en/../../../etc/passwd",
      } as unknown as Request
    })

    it("should throw an Invalid path error", async () => {
      await expect(injectEventMetadata(req)).rejects.toThrow("Invalid path")
    })

    it("should not read any file", async () => {
      await expect(injectEventMetadata(req)).rejects.toThrow()
      expect(mockReadOnce).not.toHaveBeenCalled()
    })
  })

  describe("when the request path resolves to exactly the public directory parent", () => {
    let req: Request

    beforeEach(() => {
      req = {
        path: "/..",
        query: {},
        originalUrl: "/..",
      } as unknown as Request
    })

    it("should throw an Invalid path error", async () => {
      await expect(injectEventMetadata(req)).rejects.toThrow("Invalid path")
    })

    it("should not read any file", async () => {
      await expect(injectEventMetadata(req)).rejects.toThrow()
      expect(mockReadOnce).not.toHaveBeenCalled()
    })
  })
})

describe("injectScheduleMetadata", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when the request path is a valid path within public", () => {
    let req: Request
    let result: string

    beforeEach(async () => {
      req = {
        path: "/schedule/",
        query: {},
        originalUrl: "/schedule/",
      } as unknown as Request
      mockReadOnce.mockResolvedValueOnce(Buffer.from("<html></html>"))
      mockReplaceHelmetMetadata.mockReturnValueOnce("<html>schedule</html>")
      result = await injectScheduleMetadata(req)
    })

    it("should read the file from the public directory", () => {
      const expectedPath = resolve(
        process.cwd(),
        "./public",
        "./schedule/",
        "./index.html"
      )
      expect(mockReadOnce).toHaveBeenCalledWith(expectedPath)
    })

    it("should return the page with replaced metadata", () => {
      expect(result).toBe("<html>schedule</html>")
    })
  })

  describe("when the request path contains path traversal segments", () => {
    let req: Request

    beforeEach(() => {
      req = {
        path: "/schedule/../../etc/passwd",
        query: {},
        originalUrl: "/schedule/../../etc/passwd",
      } as unknown as Request
    })

    it("should throw an Invalid path error", async () => {
      await expect(injectScheduleMetadata(req)).rejects.toThrow("Invalid path")
    })

    it("should not read any file", async () => {
      await expect(injectScheduleMetadata(req)).rejects.toThrow()
      expect(mockReadOnce).not.toHaveBeenCalled()
    })
  })
})
