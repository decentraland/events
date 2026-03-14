import React from "react"

import { GooglePlayBadge } from "decentraland-ui2/dist/components/MobileStoreBadges/GooglePlayBadge"
import {
  StoreBadgeIconWrapper,
  StoreBadgeLink,
  StoreBadgesContainer,
} from "decentraland-ui2/dist/components/MobileStoreBadges/MobileStoreBadges.styled"
import { config } from "decentraland-ui2/dist/config"

export interface MobileStoreBadgesProps {
  size?: "small" | "large"
}

const MobileStoreBadges = React.memo(
  ({ size = "small" }: MobileStoreBadgesProps) => {
    return (
      <StoreBadgesContainer>
        <StoreBadgeLink
          href={config.get("ANDROID_STORE_URL")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <StoreBadgeIconWrapper badgeSize={size}>
            <GooglePlayBadge />
          </StoreBadgeIconWrapper>
        </StoreBadgeLink>
      </StoreBadgesContainer>
    )
  }
)

export { MobileStoreBadges }
