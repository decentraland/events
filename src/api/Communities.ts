import API from "decentraland-gatsby/dist/utils/api/API"
import Options from "decentraland-gatsby/dist/utils/api/Options"
import env from "decentraland-gatsby/dist/utils/env"

export type CommunityAttributes = {
  id: string
  name: string
  ownerAddress: string
  active: boolean
}

export default class Communities extends API {
  static Url = env(
    "GATSBY_COMMUNITIES_API_URL",
    `https://social-api.decentraland.zone`
  )

  static Token = env("COMMUNITIES_API_ADMIN_TOKEN", "")

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

  static parseCommunity(community: CommunityAttributes): CommunityAttributes {
    return {
      ...community,
      active: Boolean(community.active),
    }
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
  ): Promise<CommunityAttributes[]> {
    const result = (await this.fetch<any>(url, options)) as any
    return (result.data.results || []).map(Communities.parseCommunity)
  }

  async getCommunities() {
    return this.safeApiCall(() =>
      this.fetchMany(
        `/v1/communities?roles=owner&roles=moderator`,
        this.options().authorization({ sign: true, optional: true })
      )
    )
  }

  async getCommunitiesWithToken(address: string) {
    return this.safeApiCall(() =>
      this.fetchMany(
        `/v1/communities/${address}/managed`,
        this.options().headers({ Authorization: `Bearer ${Communities.Token}` })
      )
    )
  }

  async getCommunity(communityId: string) {
    return this.safeApiCall(
      () =>
        this.fetch(
          `/v1/communities/${communityId}`,
          this.options().headers({
            Authorization: `Bearer ${Communities.Token}`,
          })
        ),
      undefined
    )
  }

  async getCommunityMembers(communityId: string) {
    return this.safeApiCall(() =>
      this.fetchMany(
        `/v1/communities/${communityId}/members`,
        // auth is required to get members from private communities
        this.options().headers({ Authorization: `Bearer ${Communities.Token}` })
      )
    )
  }

  private async safeApiCall<T>(
    apiCall: () => Promise<T>,
    defaultResult: T = [] as T
  ): Promise<T> {
    try {
      return await apiCall()
    } catch (error) {
      return [] as T
    }
  }
}
