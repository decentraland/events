import {
  POSTER_FILE_TYPES,
  POSTER_VERTICAL_FILE_TYPES,
  extension,
} from "./types"

describe("POSTER_FILE_TYPES", () => {
  it("accepts webp", () => {
    expect(POSTER_FILE_TYPES).toContain("image/webp")
  })
})

describe("POSTER_VERTICAL_FILE_TYPES", () => {
  it("accepts webp", () => {
    expect(POSTER_VERTICAL_FILE_TYPES).toContain("image/webp")
  })

  it("does not accept gif", () => {
    expect(POSTER_VERTICAL_FILE_TYPES).not.toContain("image/gif")
  })
})

describe("extension", () => {
  it("maps webp to .webp", () => {
    expect(extension("image/webp")).toBe(".webp")
  })

  it("maps the other supported types to their extension", () => {
    expect(extension("image/jpeg")).toBe(".jpg")
    expect(extension("image/png")).toBe(".png")
    expect(extension("image/gif")).toBe(".gif")
  })

  it("returns an empty string for unsupported types", () => {
    expect(extension("image/svg+xml")).toBe("")
  })
})
