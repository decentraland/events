import React from "react";
import TokenList from "decentraland-gatsby/dist/utils/TokenList";
import track from "decentraland-gatsby/dist/components/Segment/track";
import useProfile from "decentraland-gatsby/dist/hooks/useProfile";
import { EventAttributes } from "../../entities/Event/types";
import * as segment from "../../utils/segment"

import './JumpInButton.css'

const jumpIn = require('../../images/jump-in.svg')
const primaryJumpIn = require('../../images/primary-jump-in.svg')
const secondaryPin = require('../../images/secondary-pin-small.svg')

const DECENTRALAND_URL = process.env.GATSBY_DECENTRALAND_URL || 'https://play.decentraland.org'

export type JumpInButtonProps = React.HTMLProps<HTMLAnchorElement> & {
  event?: EventAttributes
  compact?: boolean
}

export default function JumpInButton({ event, href, compact, ...props }: JumpInButtonProps) {
  const [profile] = useProfile()
  const to = href || jumpTo(event) || '#'
  const isPosition = !href && !!event
  const position = isPosition ? event && (event.coordinates || []).join(',') : 'HTTP'
  const ethAddress = profile?.address.toString()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    e.stopPropagation()
    track((analytics) => analytics.track(segment.Track.JumpIn, { ethAddress, event: event?.id }))
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

export function jumpTo(event?: EventAttributes | null) {
  if (!event) {
    return null
  }

  if (event.url) {
    return event.url
  }

  const coordinates = (event.coordinates || []).slice(0, 2)

  const params = new URLSearchParams()
  if (coordinates.length) {
    params.set('position', coordinates.toString())
  }

  // if (event.reaml) {
  //   params.set('reaml', event.reaml)
  // }

  return `${DECENTRALAND_URL}/?${params.toString()}}`
}