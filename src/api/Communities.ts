import API from "decentraland-gatsby/dist/utils/api/API"
import Options from "decentraland-gatsby/dist/utils/api/Options"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"

export type CommunityAttributes = {
  id: string
  name: string
  description: string | null
  ownerAddress: string
  privacy: string
  active: boolean
  membersCount: number
  isLive: boolean
  thumbnails?: {
    raw: string
  }
}

export type AggregateCommunityAttributes = CommunityAttributes & {
  user_owned?: boolean
}

export type CommunitiesResponse = {
  data: {
    results: CommunityAttributes[]
    total: number
    page: number
    pages: number
    limit: number
  }
}

export default class Communities extends API {
  static Url = env(
    "GATSBY_COMMUNITIES_API_URL",
    `https://social-api.decentraland.zone/v1`
  )

  static Cache = new Map<string, Communities>()

  static from(url: string) {
    if (!this.Cache.has(url)) {
      this.Cache.set(url, new Communities(url))
    }

    return this.Cache.get(url)!
  }

  static get() {
    return this.from(env("COMMUNITIES_API_URL", this.Url))
  }

  static parseCommunity(
    community: CommunityAttributes
  ): AggregateCommunityAttributes {
    return {
      ...community,
      active: Boolean(community.active),
      isLive: Boolean(community.isLive),
      user_owned: false, // This will be set based on the current user
    } as AggregateCommunityAttributes
  }

  async fetch<T extends Record<string, any>>(
    url: string,
    options: Options = new Options({})
  ) {
    const result = await super.fetch<T>(url, options)
    return result
  }

  async fetchOne(
    url: string,
    options: Options = new Options({})
  ): Promise<AggregateCommunityAttributes> {
    const result = (await this.fetch<CommunitiesResponse>(url, options)) as any
    return Communities.parseCommunity(result.data.results[0])
  }

  async fetchMany(
    url: string,
    options: Options = new Options({})
  ): Promise<AggregateCommunityAttributes[]> {
    const result = (await this.fetch<CommunitiesResponse>(url, options)) as any
    return (result.data.results || []).map(Communities.parseCommunity)
  }

  async getCommunities() {
    return this.fetchMany(
      `/v1/communities`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getCommunitiesByOwner(owner: string) {
    const query = new URLSearchParams()
    query.append("owner", owner)

    return this.fetchMany(
      `/v1/communities/?${query.toString()}`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getCommunityById(id: string) {
    return this.fetchOne(
      `/v1/communities/${id}`,
      this.options().authorization({ sign: true, optional: true })
    )
  }
}
