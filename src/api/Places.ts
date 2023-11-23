import API from "decentraland-gatsby/dist/utils/api/API"
import { Realm } from "decentraland-gatsby/dist/utils/api/Catalyst.types"
import Options from "decentraland-gatsby/dist/utils/api/Options"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"

export type PlaceAttributes = {
  id: string
  title: string | null
  description: string | null
  image: string | null
  highlighted_image: string | null
  featured_image: string | null
  owner: string | null
  tags: string[]
  positions: string[]
  base_position: string
  contact_name: string | null
  contact_email: string | null
  content_rating: string | null
  likes: number
  dislikes: number
  favorites: number
  like_rate: number
  highlighted: boolean
  featured: boolean
  disabled: boolean
  disabled_at: Date | null
  created_at: Date
  updated_at: Date
  world: boolean
  world_name: string | null
  hidden: boolean
}

export type AggregatePlaceAttributes = PlaceAttributes & {
  user_like: boolean
  user_dislike: boolean
  user_favorite: boolean
  user_count?: number
  user_visits?: number
  deployed_at?: Date
  realms_detail?: Realm[]
  textsearch: string | null
}

export default class Places extends API {
  static Url = env("PLACES_API_URL", `https://places.decentraland.org/api`)

  static Cache = new Map<string, Places>()

  static from(url: string) {
    if (!this.Cache.has(url)) {
      this.Cache.set(url, new Places(url))
    }

    return this.Cache.get(url)!
  }

  static get() {
    return this.from(env("PLACES_API_URL", this.Url))
  }

  static parsePlace(place: AggregatePlaceAttributes): AggregatePlaceAttributes {
    const disabled_at = place.disabled_at && Time.date(place.disabled_at)
    const created_at = place.created_at && Time.date(place.created_at)
    const updated_at = place.updated_at && Time.date(place.updated_at)
    const deployed_at = place.deployed_at && Time.date(place.deployed_at)

    return {
      ...place,
      disabled_at,
      created_at,
      updated_at,
      deployed_at,
      highlighted: Boolean(place.highlighted),
      featured: Boolean(place.featured),
      disabled: Boolean(place.disabled),
      user_like: Boolean(place.user_like),
      user_dislike: Boolean(place.user_dislike),
      user_favorite: Boolean(place.user_favorite),
      world: Boolean(place.world),
      hidden: Boolean(place.hidden),
    } as AggregatePlaceAttributes
  }

  async fetch<T extends Record<string, any>>(
    url: string,
    options: Options = new Options({})
  ) {
    const result = await super.fetch<{ ok: boolean; data: T }>(url, options)
    return result.data
  }

  async fetchOne(
    url: string,
    options: Options = new Options({})
  ): Promise<AggregatePlaceAttributes> {
    const result = (await this.fetch(url, options)) as any
    return Places.parsePlace(result)
  }

  async fetchMany(
    url: string,
    options: Options = new Options({})
  ): Promise<AggregatePlaceAttributes[]> {
    const result = (await this.fetch(url, options)) as any
    return (result || []).map(Places.parsePlace)
  }

  async getPlaces() {
    return this.fetchMany(
      `/places`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getPlaceByPosition(position: string) {
    const places = await this.fetchMany(
      `/places/?positions=${position}`,
      this.options().authorization({ sign: true, optional: true })
    )
    return places.length > 0 ? places[0] : null
  }

  async getPlaceByPositions(positions: string[]) {
    if (positions.length === 0) {
      return []
    }

    const query = new URLSearchParams()
    for (const position of positions) {
      query.append("positions", position)
    }

    return this.fetchMany(
      `/places/?${query.toString()}`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getWorlds() {
    return this.fetchMany(
      `/worlds`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getWorldByName(names: string[]) {
    const query = new URLSearchParams()

    for (const name of names) {
      query.append("name", name)
    }
    query.append("limit", "1")
    query.append("offset", "0")
    return this.fetchMany(
      `/worlds?${query.toString()}`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getWorldNames() {
    const result: string[] = (await this.fetch(`/world_names`)) as any
    return result || []
  }
}
