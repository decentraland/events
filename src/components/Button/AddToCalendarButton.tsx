import React from "react";
import { Button, ButtonProps } from "decentraland-ui/dist/components/Button/Button";
import TokenList from "decentraland-gatsby/dist/utils/TokenList"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile";
import track from "decentraland-gatsby/dist/components/Segment/track";
import { toCalendarDate } from "decentraland-gatsby/dist/components/Date/utils";

import { EventAttributes } from "../../entities/Event/types";
import { jumpTo } from "./JumpInButton";
import * as segment from '../../utils/segment'

import './AddToCalendarButton.css'

export type AddToCalendarButtonProps = ButtonProps & {
  event?: EventAttributes
}

export default function AddToCalendarButton({ href, event, ...props }: AddToCalendarButtonProps) {
  const [profile] = useProfile()
  const to = href || getGoogleCalendar(event) || '#'
  const ethAddress = profile?.address.toString() || null

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: ButtonProps) {
    track((analytics) => analytics.track(segment.Track.AddToCalendar, { ethAddress, event: event?.id }))
    if (props.onClick) {
      props.onClick(e, data)
    }
  }

  return <Button size="small" target="_blank" {...props} onClick={handleClick} href={to} basic className={TokenList.join(['AddToCalendarButton', props.className])} >
    {props.children || 'ADD TO CALENDAR'}
  </Button>
}

function getGoogleCalendar(event?: EventAttributes | null) {
  if (!event) {
    return null
  }

  const { start_at, finish_at } = event
  const url = jumpTo(event);
  const params = new URLSearchParams()
  params.set('text', event.name)

  if (event.description && url) {
    params.set('details', `${event.description}\n\njump in: ${url}`)

  } else if (event.description) {
    params.set('details', event.description)

  } else if (url) {
    params.set('details', `jump in: ${url}`)
  }

  params.set('dates', [
    toCalendarDate(start_at),
    toCalendarDate(finish_at),
  ].join('/'))

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}