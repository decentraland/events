import React from "react";
import { Button, ButtonProps } from "decentraland-ui/dist/components/Button/Button";
import classname from "decentraland-gatsby/dist/utils/classname";

import { EventAttributes } from "../../entities/Event/types";
import { jumpTo } from "./JumpInButton";
import { toCalendarDate } from "../Date/utils";

import './AddToCalendarButton.css'

export type AddToCalendarButtonProps = ButtonProps & {
  event?: EventAttributes
}

export default function AddToCalendarButton({ href, event, ...props }: AddToCalendarButtonProps) {
  const to = href || getGoogleCalendar(event) || '#'
  return <Button size="small" target="_blank" {...props} href={to} basic className={classname(['AddToCalendarButton', props.className])} >
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