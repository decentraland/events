import React from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

import appStoreBadge from "../../images/app-store-badge.svg"
import googlePlayBadge from "../../images/google-play-badge.svg"
import { MOBILE_APP } from "../../modules/mobileApp"

interface MobileStoreBadgesProps {
  size?: "small" | "large"
  className?: string
  style?: React.CSSProperties
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  width: "100%",
}

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
  transition: "opacity 0.2s ease",
}

const MobileStoreBadges = React.memo(
  ({ size = "small", className, style }: MobileStoreBadgesProps) => {
    const l = useFormatMessage()
    const imgHeight = size === "small" ? "40px" : "48px"

    return (
      <div className={className} style={{ ...containerStyle, ...style }}>
        <a
          href={MOBILE_APP.IOS_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l("components.mobile_store_badges.download_ios")}
          style={linkStyle}
        >
          <img
            src={appStoreBadge}
            alt={l("components.mobile_store_badges.download_ios")}
            style={{ height: imgHeight }}
          />
        </a>
        <a
          href={MOBILE_APP.ANDROID_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l("components.mobile_store_badges.download_android")}
          style={linkStyle}
        >
          <img
            src={googlePlayBadge}
            alt={l("components.mobile_store_badges.download_android")}
            style={{ height: imgHeight }}
          />
        </a>
      </div>
    )
  }
)

export { MobileStoreBadges }
