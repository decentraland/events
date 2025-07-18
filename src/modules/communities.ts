import Communities, { AggregateCommunityAttributes } from "../api/Communities"

export const getCommunitiesByOwner = async (
  ownerAddress?: string
): Promise<AggregateCommunityAttributes[]> => {
  const allCommunities = await Communities.get().getCommunities()

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
