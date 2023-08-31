import React, { useCallback } from "react"

import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import { EventAttributes } from "../../entities/Event/types"
import { eventTargetUrl } from "../../entities/Event/utils"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"
import secondaryPinIcon from "../../images/secondary-pin-small.svg"
import { SegmentEvent } from "../../modules/segment"

import "./JumpInPosition.css"

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
  const track = useTrackContext()
  const to = href || (event && eventTargetUrl(event)) || "#"
  const isPosition = !href && !!event
  const position = isPosition ? event && `${event.x},${event.y}` : "HTTP"

  const handleClick = useCallback(
    function (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
      e.stopPropagation()

      if (props.onClick) {
        props.onClick(e)
      }

      if (!e.defaultPrevented) {
        track(SegmentEvent.JumpIn, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
          world: event?.world || false,
          world_name: event?.world ? event.server : false,
        })
      }
    },
    [event, track]
  )

  return (
    <Link
      {...props}
      target="_blank"
      onClick={handleClick}
      href={to}
      className={TokenList.join([
        "jump-in-position",
        compact && "jump-in-position--compact",
        props.className,
      ])}
    >
      <span className="jump-in-position__position">
        {isPosition && <img src={secondaryPinIcon} width="16" height="16" />}
        <span>{event?.world ? event.server : position}</span>
      </span>
      <span className="jump-in-position__icon">
        <img src={primaryJumpInIcon} width={16} height={16} />
      </span>
    </Link>
  )
}
