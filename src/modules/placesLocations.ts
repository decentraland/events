import API from "decentraland-gatsby/dist/utils/api/API"
import env from "decentraland-gatsby/dist/utils/env"

const PLACES_URL = env("PLACES_URL", "https://places.decentraland.org")

export function url(
  path: string,
  query?: Record<string, string> | URLSearchParams
) {
  return API.url(PLACES_URL, path, query)
}

export default {
  place: (position: string) => url("/place/", { position }),
  world: (name: string) => url("/world/", { name }),
}
