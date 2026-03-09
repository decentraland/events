import React from "react"

import { MobileStoreBadges as BaseMobileStoreBadges } from "decentraland-ui2"

export interface MobileStoreBadgesProps {
  size?: "small" | "large"
}

const MobileStoreBadges = React.memo(
  ({ size = "small" }: MobileStoreBadgesProps) => {
    return <BaseMobileStoreBadges size={size} />
  }
)

export { MobileStoreBadges }
