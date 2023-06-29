import React, { useCallback } from "react"

import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import {
  Button,
  ButtonProps,
} from "decentraland-ui/dist/components/Button/Button"
import { EventAttributes } from "events-type/src/types/Event"
import { eventTargetUrl } from "events-web/src/entities/Event/utils"
import { SegmentEvent } from "events-web/src/modules/segment"

import "./AddToCalendarButton.css"

export type AddToCalendarButtonProps = ButtonProps & {
  event?: EventAttributes
  startAt?: Date
}

export default function AddToCalendarButton({
  href,
  event,
  startAt,
  ...props
}: AddToCalendarButtonProps) {
  const track = useTrackContext()
  const l = useFormatMessage()
  const to = href || getGoogleCalendar(event, startAt) || "#"

  const handleClick = useCallback(
    function (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      data: ButtonProps
    ) {
      track(SegmentEvent.AddToCalendar, {
        eventId: event?.id || null,
        trending: event?.trending || false,
        highlighted: event?.highlighted || false,
      })
      if (props.onClick) {
        props.onClick(e, data)
      }
    },
    [event, track]
  )

  return (
    <Button
      size="small"
      target="_blank"
      {...props}
      onClick={handleClick}
      href={to}
      basic
      className={TokenList.join(["add-calendar__button", props.className])}
    >
      {props.children || l("components.button.add_to_calendar")}
    </Button>
  )
}

function getGoogleCalendar(event?: EventAttributes | null, startAt?: Date) {
  if (!event) {
    return null
  }

  const l = useFormatMessage()
  const url = eventTargetUrl(event)
  const params = new URLSearchParams()
  params.set("text", event.name)

  const jumpInLabel = l("components.button.get_google_calendar.jump_in")

  if (event.description && url) {
    params.set("details", `${event.description}\n\n${jumpInLabel}: ${url}`)
  } else if (event.description) {
    params.set("details", event.description)
  } else if (url) {
    params.set("details", `${jumpInLabel}: ${url}`)
  }

  const start_at = startAt || event.start_at
  const dates = [
    Time.from(start_at, { utc: true }).format(Time.Formats.GoogleCalendar),
    Time.from(start_at.getTime() + event.duration, { utc: true }).format(
      Time.Formats.GoogleCalendar
    ),
  ]
  params.set("dates", dates.join("/"))

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}
