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
  const communityOptions = communities.map((community) => ({
    key: community.id,
    text: community.name,
    value: community.id,
  }))

  // Add "None" option at the beginning to unselect the community
  return [
    {
      key: "none",
      text: "None",
      value: undefined,
    },
    ...communityOptions,
  ]
}
