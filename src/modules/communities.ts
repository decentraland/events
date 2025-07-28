import Communities, { CommunityAttributes } from "../api/Communities"

export const getCommunitiesByOwner = async (): Promise<
  CommunityAttributes[]
> => {
  const allCommunities = await Communities.get().getCommunities()
  return allCommunities.filter((community) => community.active)
}

export const getCommunitiesOptions = (communities: CommunityAttributes[]) => {
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
