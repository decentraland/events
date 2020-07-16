import React from "react";
import TokenList from "decentraland-gatsby/dist/utils/TokenList";
import track from "decentraland-gatsby/dist/components/Segment/track";
import useProfile from "decentraland-gatsby/dist/hooks/useProfile";
import { EventAttributes } from "../../entities/Event/types";
import * as segment from "../../utils/segment"

import './JumpInButton.css'
import { eventTargetUrl } from "../../entities/Event/utils";

const primaryJumpIn = require('../../images/primary-jump-in.svg')
const secondaryPin = require('../../images/secondary-pin-small.svg')

export type JumpInButtonProps = React.HTMLProps<HTMLAnchorElement> & {
  event?: EventAttributes
  compact?: boolean
}

export default function JumpInButton({ event, href, compact, ...props }: JumpInButtonProps) {
  const [profile] = useProfile()
  const to = href || event && eventTargetUrl(event) || '#'
  const isPosition = !href && !!event
  const position = isPosition ? event && `${event.x},${event.y}` : 'HTTP'
  const ethAddress = profile?.address.toString()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    e.stopPropagation()
    track((analytics) => analytics.track(segment.Track.JumpIn, { ethAddress, event: event?.id || null }))
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return <a {...props} target="_blank" onClick={handleClick} href={to} className={TokenList.join(['JumpInButton', compact && 'JumpInButton--compact', props.className])}>
    <span className="JumpInButton__Position">
      {isPosition && <img src={secondaryPin} width="16" height="16" />}
      <span>{position}</span>
    </span>
    <span className="JumpInButton__Icon">
      <img src={primaryJumpIn} width={16} height={16} />
    </span>
  </a>
}
