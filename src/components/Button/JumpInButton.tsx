import React from "react";
import { Button, ButtonProps } from "decentraland-ui/dist/components/Button/Button";
import TokenList from "decentraland-gatsby/dist/utils/TokenList";
import track from "decentraland-gatsby/dist/components/Segment/track";
import useProfile from "decentraland-gatsby/dist/hooks/useProfile";
import { EventAttributes } from "../../entities/Event/types";
import * as segment from "../../utils/segment"

import './JumpInButton.css'

const jumpIn = require('../../images/jump-in.svg')

const DECENTRALAND_URL = process.env.GATSBY_DECENTRALAND_URL || 'https://play.decentraland.org'

export type JumpInButtonProps = ButtonProps & {
  event?: EventAttributes
}

export default function JumpInButton({ primary, secondary, inverted, event, href, ...props }: JumpInButtonProps) {
  const [profile] = useProfile()
  const to = href || jumpTo(event) || '#'
  const ethAddress = profile?.address.toString()

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: ButtonProps) {
    e.stopPropagation()
    track((analytics) => analytics.track(segment.Track.JumpIn, { ethAddress, event: event?.id }))
    if (props.onClick) {
      props.onClick(e, data)
    }
  }

  return <Button size="small" target="_blank" {...props} onClick={handleClick} href={to} basic className={TokenList.join(['JumpInButton', props.className])} >
    {props.children ?? 'JUMP IN'}
    <img src={jumpIn} width="16" height="16" />
  </Button>
}

export function jumpTo(event?: EventAttributes | null) {
  if (!event) {
    return null
  }

  if (event.url) {
    return event.url
  }

  const coordinates = event.coordinates || []
  return `${DECENTRALAND_URL}/?position=${coordinates.join(',')}`
}