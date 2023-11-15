import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"

import { Flags } from "../../../../modules/features"

export function useDecentralandFoundationAddresses() {
  const [ff] = useFeatureFlagContext()
  if (
    ff.flags[Flags.DCLFoundationAddresses] &&
    ff.variants[Flags.DCLFoundationAddresses].payload
  ) {
    return JSON.parse(
      ff.variants[Flags.DCLFoundationAddresses].payload.value
    ).map((address: string) => address.toLowerCase())
  }

  return []
}
