import Dataloader from "dataloader"

import Communities, { AggregateCommunityAttributes } from "../api/Communities"

const CACHE = new Map<string, AggregateCommunityAttributes[]>()
export const communities = new Dataloader(async (owners: readonly string[]) => {
  const missingOwners = owners.filter((owner) => !CACHE.has(owner))

  if (missingOwners.length > 0) {
    const allCommunities = await Communities.get().getCommunities()

    // Group communities by owner
    const communitiesByOwner = new Map<string, AggregateCommunityAttributes[]>()
    for (const community of allCommunities) {
      const owner = community.ownerAddress
      if (!communitiesByOwner.has(owner)) {
        communitiesByOwner.set(owner, [])
      }
      communitiesByOwner.get(owner)!.push(community)
    }

    // Cache the results
    for (const [owner, communities] of communitiesByOwner) {
      CACHE.set(owner, communities)
    }
  }

  return owners.map((owner) => CACHE.get(owner) || [])
})

export const getCommunitiesByOwner = async (
  ownerAddress?: string
): Promise<AggregateCommunityAttributes[]> => {
  const allCommunities = await Communities.get().getCommunities()
  console.log("allCommunities", allCommunities)

  if (ownerAddress) {
    return allCommunities.filter(
      (community) => community.ownerAddress === ownerAddress
    )
  }

  return allCommunities
}

export const getCommunitiesOptions = (
  communities: AggregateCommunityAttributes[]
) => {
  return communities.map((community) => ({
    key: community.id,
    text: community.name,
    value: community.id,
  }))
}

export const markUserOwnedCommunities = (
  communities: AggregateCommunityAttributes[],
  userAddress: string
) => {
  return communities.map((community) => ({
    ...community,
    user_owned: community.ownerAddress === userAddress,
  }))
}
