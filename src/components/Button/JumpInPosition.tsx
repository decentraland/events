import React, { useCallback } from "react"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import track from "decentraland-gatsby/dist/utils/development/segment"
import { EventAttributes } from "../../entities/Event/types"

import { eventTargetUrl } from "../../entities/Event/utils"
import { SegmentEvent } from "../../modules/segment"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"
import secondaryPinIcon from "../../images/secondary-pin-small.svg"
import "./JumpInPosition.css"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"

export type JumpInPositionProps = React.HTMLProps<HTMLAnchorElement> & {
  event?: EventAttributes
  compact?: boolean
}

export default function JumpInPosition({
  event,
  href,
  compact,
  ...props
}: JumpInPositionProps) {
  const [address] = useAuthContext()
  const [ ff ] = useFeatureFlagContext()
  const to = href || (event && eventTargetUrl(event)) || "#"
  const isPosition = !href && !!event
  const position = isPosition ? event && `${event.x},${event.y}` : "HTTP"
  const ethAddress = address

  const handleClick = useCallback(function (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    if (props.onClick) {
      props.onClick(e)
    }

    if (!e.defaultPrevented) {
      track((analytics) =>
        analytics.track(SegmentEvent.JumpIn, {
          ethAddress,
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
          featureFlag: ff.flags
        })
      )
    }
  }, [ event, ethAddress, ff ])

  return (
    <a
      {...props}
      target="_blank"
      onClick={handleClick}
      href={to}
      className={TokenList.join([
        "JumpInPosition",
        compact && "JumpInPosition--compact",
        props.className,
      ])}
    >
      <span className="JumpInPosition__Position">
        {isPosition && <img src={secondaryPinIcon} width="16" height="16" />}
        <span>{position}</span>
      </span>
      <span className="JumpInPosition__Icon">
        <img src={primaryJumpInIcon} width={16} height={16} />
      </span>
    </a>
  )
}
