import React from "react";
import { Button, ButtonProps } from "decentraland-ui/dist/components/Button/Button";
import classname from "decentraland-gatsby/dist/utils/classname";

import './JumpInButton.css'
import { EventAttributes } from "../../entities/Event/types";

const jumpIn = require('../../images/jump-in.svg')

const DECENTRALAND_URL = process.env.GATSBY_DECENTRALAND_URL || 'https://play.decentraland.org'

export type JumpInButtonProps = ButtonProps & {
  event?: EventAttributes
}

export default function JumpInButton({ primary, secondary, inverted, event, href, ...props }: JumpInButtonProps) {
  const to = href || jumpTo(event) || '#'
  return <Button size="small" target="_blank" {...props} href={to} basic className={classname(['JumpInButton', props.className])} >
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