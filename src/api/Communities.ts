import API from "decentraland-gatsby/dist/utils/api/API"
import Options from "decentraland-gatsby/dist/utils/api/Options"
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

export type AggregateCommunityAttributes = CommunityAttributes

export default class Communities extends API {
  static Url = env(
    "GATSBY_COMMUNITIES_API_URL",
    `https://social-api.decentraland.zone`
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
    } as AggregateCommunityAttributes
  }

  async fetch<T extends Record<string, any>>(
    url: string,
    options: Options = new Options({})
  ) {
    const result = await super.fetch<T>(url, options)
    return result
  }

  async fetchMany(
    url: string,
    options: Options = new Options({})
  ): Promise<AggregateCommunityAttributes[]> {
    const result = (await this.fetch<any>(url, options)) as any
    return (result.data.results || []).map(Communities.parseCommunity)
  }

  async getCommunities() {
    return this.fetchMany(
      `/v1/communities?onlyMemberOf=true`, // TODO: retrieve only communities you own or manage
      this.options().authorization({ sign: true })
    )
  }
}
