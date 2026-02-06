import API from "decentraland-gatsby/dist/utils/api/API"
import env from "decentraland-gatsby/dist/utils/env"

export type CommunityAttributes = {
  id: string
  name: string
  ownerAddress: string
  active: boolean
  thumbnails?: {
    raw: string
  }
}

export type CommunityMemberAttributes = {
  communityId: string
  memberAddress: string
  role: string
  joinedAt: string
  profilePictureUrl?: string
  hasClaimedName: boolean
  name?: string
  friendshipStatus: number
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

  static parseCommunityMember(
    member: CommunityMemberAttributes
  ): CommunityMemberAttributes {
    return {
      ...member,
      active: Boolean(member.active),
      hasClaimedName: Boolean(member.hasClaimedName),
    }
  }

  async getCommunities(): Promise<CommunityAttributes[]> {
    return this.safeApiCall(async () => {
      const result = await this.fetch<any>(
        `/v1/communities?roles=owner&roles=moderator`,
        this.options().authorization({ sign: true, optional: true })
      )
      const items = result.data?.results || []
      return items.map(Communities.parseCommunity)
    })
  }

  async getCommunitiesWithToken(
    address: string
  ): Promise<CommunityAttributes[]> {
    return this.safeApiCall(async () => {
      const result = await this.fetch<any>(
        `/v1/communities/${address}/managed`,
        this.options().headers({ Authorization: `Bearer ${Communities.Token}` })
      )
      const items = result.data?.results || []
      return items.map(Communities.parseCommunity)
    })
  }

  async getCommunity(communityId: string): Promise<CommunityAttributes | null> {
    const result = await this.safeApiCall(
      async () =>
        this.fetch<{ data: CommunityAttributes }>(
          `/v1/communities/${communityId}`,
          this.options().headers({
            Authorization: `Bearer ${Communities.Token}`,
          })
        ),
      null
    )
    return result?.data
      ? Communities.parseCommunity(result.data as CommunityAttributes)
      : null
  }

  /** Page size for members API (matches typical API default/max). */
  private static readonly MEMBERS_PAGE_SIZE = 100

  async getCommunityMembers(
    communityId: string
  ): Promise<CommunityMemberAttributes[]> {
    return this.safeApiCall(async () => {
      const all: CommunityMemberAttributes[] = []
      let nextPage = 1
      let totalPages = 1
      const opts = Communities.Token
        ? this.options().headers({
            Authorization: `Bearer ${Communities.Token}`,
          })
        : this.options()

      do {
        const offset = (nextPage - 1) * Communities.MEMBERS_PAGE_SIZE
        const path = `/v1/communities/${communityId}/members?${API.searchParams(
          {
            limit: Communities.MEMBERS_PAGE_SIZE,
            offset,
          }
        ).toString()}`
        const result = await this.fetch<{
          data: {
            results: unknown[]
            total: number
            limit: number
            page: number
            pages: number
          }
        }>(path, opts)

        const data = result.data
        const items = data.results
        totalPages = data.pages
        const currentPage = data.page

        all.push(
          ...items.map((item) =>
            Communities.parseCommunityMember(item as CommunityMemberAttributes)
          )
        )

        nextPage = currentPage + 1
      } while (nextPage <= totalPages)

      return all
    })
  }

  private async safeApiCall<T>(
    apiCall: () => Promise<T>,
    defaultResult: T = [] as T
  ): Promise<T> {
    try {
      return await apiCall()
    } catch (error) {
      return defaultResult as T
    }
  }
}
