import React from "react"
import {
  Button,
  ButtonProps,
} from "decentraland-ui/dist/components/Button/Button"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import useAuth from "decentraland-gatsby/dist/hooks/useAuth"
import track from "decentraland-gatsby/dist/utils/development/segment"
import Time from "decentraland-gatsby/dist/utils/date/Time"

import { EventAttributes } from "../../entities/Event/types"
import { SegmentEvent } from "../../modules/segment"

import { eventTargetUrl } from "../../entities/Event/utils"
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
  const [address] = useAuth()
  const to = href || getGoogleCalendar(event, startAt) || "#"

  function handleClick(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    data: ButtonProps
  ) {
    track((analytics) =>
      analytics.track(SegmentEvent.AddToCalendar, {
        ethAddress: address,
        eventId: event?.id,
      })
    )
    if (props.onClick) {
      props.onClick(e, data)
    }
  }

  return (
    <Button
      size="small"
      target="_blank"
      {...props}
      onClick={handleClick}
      href={to}
      basic
      className={TokenList.join(["AddToCalendarButton", props.className])}
    >
      {props.children || "ADD TO CALENDAR"}
    </Button>
  )
}

function getGoogleCalendar(event?: EventAttributes | null, startAt?: Date) {
  if (!event) {
    return null
  }

  const url = eventTargetUrl(event)
  const params = new URLSearchParams()
  params.set("text", event.name)

  if (event.description && url) {
    params.set("details", `${event.description}\n\njump in: ${url}`)
  } else if (event.description) {
    params.set("details", event.description)
  } else if (url) {
    params.set("details", `jump in: ${url}`)
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
