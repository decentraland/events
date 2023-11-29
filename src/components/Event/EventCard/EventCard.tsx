import React, { useCallback, useMemo } from "react"

import { withPrefix } from "gatsby"

import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import Avatar from "decentraland-gatsby/dist/components/Profile/Avatar"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Card } from "decentraland-ui/dist/components/Card/Card"

import { SessionEventAttributes } from "../../../entities/Event/types"
import locations from "../../../modules/locations"
import StartIn from "../../Badge/StartIn"
import AttendingButtons from "../../Button/AttendingButtons"
import JumpInPosition from "../../Button/JumpInPosition"
import EventDate from "../EventDate/EventDate"

import "./EventCard.css"

const EVENTS_LIST = 3

export type EventCardProps = {
  event?: SessionEventAttributes
  loading?: boolean
  onClick?: (
    e: React.MouseEvent<HTMLAnchorElement>,
    data: SessionEventAttributes
  ) => void
}

export default React.memo(function EventCard(props: EventCardProps) {
  const event = props.event
  const onClick = props.onClick
  const href = useMemo(() => event && locations.event(event.id), [event])
  const nextStartAt = useMemo(
    () =>
      new Date(event ? Date.parse(event.next_start_at.toString()) : Date.now()),
    [event?.next_start_at]
  )
  const handleJumpIn = useCallback(
    (e: React.MouseEvent<any>) => e.preventDefault(),
    []
  )
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (event) {
        if (onClick) {
          onClick(e, event)
        }

        if (!e.defaultPrevented) {
          navigate(locations.event(event.id))
        }
      }
    },
    [event, onClick]
  )

  return (
    <Card
      link
      className={TokenList.join([
        "event-card",
        props.loading && "loading",
        event && !event.approved && "pending",
      ])}
      href={href ? withPrefix(href) : href}
      onClick={handleClick}
    >
      {event && <StartIn date={nextStartAt} />}
      <div className="event-card__cover">
        {event && event.total_attendees > 0 && (
          <div className="event-card__attendees">
            {event.latest_attendees.slice(0, EVENTS_LIST).map((address) => (
              <Avatar size="mini" key={address} address={address} />
            ))}
            {event.total_attendees > EVENTS_LIST && (
              <div className="event-card__attendees-more">
                <div>+{Math.max(event.total_attendees - EVENTS_LIST, 0)}</div>
              </div>
            )}
          </div>
        )}
        <ImgFixed src={event?.image || ""} dimension="wide" />
      </div>
      <Card.Content>
        {event && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <EventDate event={event} />
            <div>
              <JumpInPosition event={event} onClick={handleJumpIn} />
            </div>
          </div>
        )}

        <Card.Header>{event?.name || " "}</Card.Header>
        <Card.Description>
          <AttendingButtons event={event} />
        </Card.Description>
      </Card.Content>
    </Card>
  )
})
