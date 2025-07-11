export type Option = { key: string; value: string; text: string }

// Mock community data - in a real implementation, this would come from an API
const MOCK_COMMUNITIES: Option[] = [
  { key: "all", value: "", text: "All Communities" },
  { key: "art", value: "art", text: "Art & Culture" },
  { key: "music", value: "music", text: "Music" },
  { key: "gaming", value: "gaming", text: "Gaming" },
  { key: "education", value: "education", text: "Education" },
  { key: "social", value: "social", text: "Social Activities" },
  { key: "business", value: "business", text: "Business & Networking" },
  { key: "sports", value: "sports", text: "Sports" },
  { key: "technology", value: "technology", text: "Technology" },
  { key: "fashion", value: "fashion", text: "Fashion" },
]

export function getCommunityOptions(): Option[] {
  return MOCK_COMMUNITIES
}

export function getCommunityOptionsWithExclude(exclude: string[] = []): Option[] {
  if (exclude.length === 0) {
    return getCommunityOptions()
  }
  
  const excludeSet = new Set(exclude)
  return getCommunityOptions().filter((community: Option) => !excludeSet.has(community.value))
}

export function findCommunityByValue(value: string): Option | undefined {
  return getCommunityOptions().find((community: Option) => community.value === value)
} 