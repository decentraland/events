export const POSTER_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"]
export const POSTER_FILE_SIZE = 500 * 1024

// Vertical poster specific validations
export const POSTER_VERTICAL_FILE_TYPES = ["image/jpeg", "image/png"]
export const POSTER_VERTICAL_FILE_SIZE = 500 * 1024 // 500 KB
export const POSTER_VERTICAL_RECOMMENDED_WIDTH = 716
export const POSTER_VERTICAL_RECOMMENDED_HEIGHT = 1814

export type PosterAttributes = {
  filename: string
  url: string
  size: number
  type: string
}

export function extension(type: string) {
  switch (type) {
    case "image/gif":
      return ".gif"

    case "image/png":
      return ".png"

    case "image/jpeg":
      return ".jpg"

    default:
      return ""
  }
}
