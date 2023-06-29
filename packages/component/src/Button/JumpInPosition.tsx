import React, { useCallback } from "react"

import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { EventAttributes } from "events-type/src/types/Event"
import { eventTargetUrl } from "events-web/src/entities/Event/utils"
import { SegmentEvent } from "events-web/src/modules/segment"

import primaryJumpInIcon from "../images/primary-jump-in.svg"
import secondaryPinIcon from "../images/secondary-pin-small.svg"

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
      if (props.onClick) {
        props.onClick(e)
      }

      if (!e.defaultPrevented) {
        track(SegmentEvent.JumpIn, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
        })
      }
    },
    [event, track]
  )

  return (
    <a
      {...props}
      target="_blank"
      onClick={handleClick}
      href={to}
      className={TokenList.join([
        "jumpin-position",
        compact && "jumpin-position--compact",
        props.className,
      ])}
    >
      <span className="jumpin-position__position">
        {isPosition && <img src={secondaryPinIcon} width="16" height="16" />}
        <span>{position}</span>
      </span>
      <span className="jumpin-position__icon">
        <img src={primaryJumpInIcon} width={16} height={16} />
      </span>
    </a>
  )
}
