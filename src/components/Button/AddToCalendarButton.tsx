import React from "react";
import { Button, ButtonProps } from "decentraland-ui/dist/components/Button/Button";
import TokenList from "decentraland-gatsby/dist/utils/TokenList"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile";
import track from "decentraland-gatsby/dist/components/Segment/track";
import Datetime from "decentraland-gatsby/dist/utils/Datetime";

import { EventAttributes } from "../../entities/Event/types";
import * as segment from '../../utils/segment'

import { eventTargetUrl } from "../../entities/Event/utils";
import './AddToCalendarButton.css'

export type AddToCalendarButtonProps = ButtonProps & {
  event?: EventAttributes,
  startAt?: Date,
}

export default function AddToCalendarButton({ href, event, startAt, ...props }: AddToCalendarButtonProps) {
  const [profile] = useProfile()
  const to = href || getGoogleCalendar(event, startAt) || '#'
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

function getGoogleCalendar(event?: EventAttributes | null, startAt?: Date) {
  if (!event) {
    return null
  }

  const start_at = Datetime.from(startAt || event.start_at)
  const finish_at = Datetime.from(start_at.getTime() + event.duration)
  const url = eventTargetUrl(event);
  const params = new URLSearchParams()
  params.set('text', event.name)

  if (event.description && url) {
    params.set('details', `${event.description}\n\njump in: ${url}`)

  } else if (event.description) {
    params.set('details', event.description)

  } else if (url) {
    params.set('details', `jump in: ${url}`)
  }

  params.set('dates', [start_at.toGoogleCalendar(), finish_at.toGoogleCalendar()].join('/'))

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}