import React from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

import {
  StoreBadgeImage,
  StoreBadgeLink,
  StoreBadgesContainer,
} from "./MobileStoreBadges.styled"
import { MobileStoreBadgesProps } from "./MobileStoreBadges.types"
import appStoreBadge from "../../images/app-store-badge.svg"
import googlePlayBadge from "../../images/google-play-badge.svg"
import { MOBILE_APP } from "../../modules/mobileApp"

const MobileStoreBadges = React.memo(
  ({ size = "small", className }: MobileStoreBadgesProps) => {
    const l = useFormatMessage()

    return (
      <StoreBadgesContainer className={className}>
        <StoreBadgeLink
          href={MOBILE_APP.IOS_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l("components.mobile_store_badges.download_ios")}
        >
          <StoreBadgeImage
            src={appStoreBadge}
            alt={l("components.mobile_store_badges.download_ios")}
            badgeSize={size}
          />
        </StoreBadgeLink>
        <StoreBadgeLink
          href={MOBILE_APP.ANDROID_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l("components.mobile_store_badges.download_android")}
        >
          <StoreBadgeImage
            src={googlePlayBadge}
            alt={l("components.mobile_store_badges.download_android")}
            badgeSize={size}
          />
        </StoreBadgeLink>
      </StoreBadgesContainer>
    )
  }
)

export { MobileStoreBadges }
