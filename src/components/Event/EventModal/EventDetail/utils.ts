import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"

import { Flags } from "../../../../modules/features"

export function useDecentralandFoundationAddresses() {
  const [ff] = useFeatureFlagContext()
  const isFoundationAddressesEnabled = ff.flags[Flags.DCLFoundationAddresses]
  const payload = ff.variants[Flags.DCLFoundationAddresses].payload
  if (isFoundationAddressesEnabled && payload) {
    return JSON.parse(payload.value).map((address: string) =>
      address.toLowerCase()
    )
  }

  return []
}
