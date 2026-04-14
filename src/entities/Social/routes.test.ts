import { resolve } from "path"

import { replaceHelmetMetadata } from "decentraland-gatsby/dist/entities/Gatsby/utils"
import { readOnce } from "decentraland-gatsby/dist/entities/Route/routes/file"
import { Request } from "express"

import { injectEventMetadata, injectScheduleMetadata } from "./routes"
import EventModel from "../Event/model"
import ScheduleModel from "../Schedule/model"

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

  describe("when a matching event is found", () => {
    let req: Request

    describe("and the event contains HTML in its fields", () => {
      beforeEach(async () => {
        req = {
          path: "/event/",
          query: { id: "550e8400-e29b-41d4-a716-446655440000" },
          originalUrl: "/event/?id=550e8400-e29b-41d4-a716-446655440000",
        } as unknown as Request
        ;(EventModel.findOne as jest.Mock).mockResolvedValueOnce({
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: '<img src=x onerror="alert(1)">',
          description: '"><script>alert(2)</script>',
          image: '"><svg onload=alert(3)>',
        })
        mockReadOnce.mockResolvedValueOnce(Buffer.from("<html></html>"))
        mockReplaceHelmetMetadata.mockReturnValueOnce("<html></html>")
        await injectEventMetadata(req)
      })

      it("should HTML-escape the event name in the title", () => {
        const title = mockReplaceHelmetMetadata.mock.calls[0][1].title as string
        expect(title).not.toContain("<img")
        expect(title).toContain("&lt;img")
      })

      it("should HTML-escape the event description", () => {
        const description = mockReplaceHelmetMetadata.mock.calls[0][1]
          .description as string
        expect(description).not.toContain("<script>")
        expect(description).toContain("&lt;script&gt;")
      })

      it("should HTML-escape the event image", () => {
        const image = mockReplaceHelmetMetadata.mock.calls[0][1].image as string
        expect(image).not.toContain("<svg")
        expect(image).toContain("&lt;svg")
      })

      it("should HTML-escape the event url", () => {
        const url = mockReplaceHelmetMetadata.mock.calls[0][1].url as string
        expect(url).not.toContain("<")
        expect(url).not.toContain('"')
      })
    })
  })

  describe("when originalUrl contains HTML characters", () => {
    let req: Request

    beforeEach(async () => {
      req = {
        path: "/event/",
        query: {},
        originalUrl: '/event/?id="><script>alert(1)</script>',
      } as unknown as Request
      mockReadOnce.mockResolvedValueOnce(Buffer.from("<html></html>"))
      mockReplaceHelmetMetadata.mockReturnValueOnce("<html></html>")
      await injectEventMetadata(req)
    })

    it("should HTML-escape angle brackets in the url", () => {
      const urlArg = mockReplaceHelmetMetadata.mock.calls[0][1].url as string
      expect(urlArg).not.toContain("<script>")
      expect(urlArg).toContain("&lt;script&gt;")
    })

    it("should HTML-escape double quotes in the url", () => {
      const urlArg = mockReplaceHelmetMetadata.mock.calls[0][1].url as string
      expect(urlArg).not.toContain('">')
      expect(urlArg).toContain("&quot;")
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

  describe("when a matching schedule is found", () => {
    let req: Request

    describe("and the schedule contains HTML in its fields", () => {
      beforeEach(async () => {
        req = {
          path: "/schedule/",
          query: { id: "550e8400-e29b-41d4-a716-446655440000" },
          originalUrl: "/schedule/?id=550e8400-e29b-41d4-a716-446655440000",
        } as unknown as Request
        ;(ScheduleModel.findOne as jest.Mock).mockResolvedValueOnce({
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: '<img src=x onerror="alert(1)">',
          description: '"><script>alert(2)</script>',
          image: '"><svg onload=alert(3)>',
        })
        mockReadOnce.mockResolvedValueOnce(Buffer.from("<html></html>"))
        mockReplaceHelmetMetadata.mockReturnValueOnce("<html></html>")
        await injectScheduleMetadata(req)
      })

      it("should HTML-escape the schedule name in the title", () => {
        const title = mockReplaceHelmetMetadata.mock.calls[0][1].title as string
        expect(title).not.toContain("<img")
        expect(title).toContain("&lt;img")
      })

      it("should HTML-escape the schedule description", () => {
        const description = mockReplaceHelmetMetadata.mock.calls[0][1]
          .description as string
        expect(description).not.toContain("<script>")
        expect(description).toContain("&lt;script&gt;")
      })

      it("should HTML-escape the schedule image", () => {
        const image = mockReplaceHelmetMetadata.mock.calls[0][1].image as string
        expect(image).not.toContain("<svg")
        expect(image).toContain("&lt;svg")
      })

      it("should HTML-escape the schedule url", () => {
        const url = mockReplaceHelmetMetadata.mock.calls[0][1].url as string
        expect(url).not.toContain("<")
        expect(url).not.toContain('"')
      })
    })
  })

  describe("when originalUrl contains HTML characters", () => {
    let req: Request

    beforeEach(async () => {
      req = {
        path: "/schedule/",
        query: {},
        originalUrl: '/schedule/?id="><img onerror=alert(1)>',
      } as unknown as Request
      mockReadOnce.mockResolvedValueOnce(Buffer.from("<html></html>"))
      mockReplaceHelmetMetadata.mockReturnValueOnce("<html></html>")
      await injectScheduleMetadata(req)
    })

    it("should HTML-escape angle brackets in the url", () => {
      const urlArg = mockReplaceHelmetMetadata.mock.calls[0][1].url as string
      expect(urlArg).not.toContain("<img")
      expect(urlArg).toContain("&lt;img")
    })
  })
})
