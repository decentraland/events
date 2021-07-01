import React from "react";
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList";
import track from "decentraland-gatsby/dist/utils/segment/segment";
import { EventAttributes } from "../../entities/Event/types";

import './JumpInPosition.css'
import { eventTargetUrl } from "../../entities/Event/utils";
import { SegmentEvent } from "../../modules/segment";
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext";

const primaryJumpIn = require('../../images/primary-jump-in.svg')
const secondaryPin = require('../../images/secondary-pin-small.svg')

export type JumpInPositionProps = React.HTMLProps<HTMLAnchorElement> & {
  event?: EventAttributes
  compact?: boolean
}

export default function JumpInPosition({ event, href, compact,  ...props }: JumpInPositionProps) {
  const [address] = useAuthContext()
  const to = href || event && eventTargetUrl(event) || '#'
  const isPosition = !href && !!event
  const position = isPosition ? event && `${event.x},${event.y}` : 'HTTP'
  const ethAddress = address

  function handleClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    if (props.onClick) {
      props.onClick(e)
    }

    if (!e.defaultPrevented) {
      track((analytics) => analytics.track(SegmentEvent.JumpIn, { ethAddress, event: event?.id || null }))
    }
  }

  return <a {...props} target="_blank" onClick={handleClick} href={to} className={TokenList.join(['JumpInPosition', compact && 'JumpInPosition--compact', props.className])}>
    <span className="JumpInPosition__Position">
      {isPosition && <img src={secondaryPin} width="16" height="16" />}
      <span>{position}</span>
    </span>
    <span className="JumpInPosition__Icon">
      <img src={primaryJumpIn} width={16} height={16} />
    </span>
  </a>
}