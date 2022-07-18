import API from "decentraland-gatsby/dist/utils/api/API"
import Options from "decentraland-gatsby/dist/utils/api/Options"

import { PosterAttributes } from "../entities/Poster/types"

export default class S3 extends API {
  static get(url = "") {
    return new S3(url)
  }

  async fetch<T extends Record<string, any>>(
    url: string,
    options: Options = new Options({})
  ) {
    const result = await super.fetch<{ ok: boolean; data: T }>(url, options)
    return result.data
  }

  async uploadRemotePoster(file: File): Promise<PosterAttributes> {
    return this.fetch(
      "",
      this.options({
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    )
  }
}
