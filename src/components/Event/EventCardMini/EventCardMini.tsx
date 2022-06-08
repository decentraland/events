import React, { useCallback, useMemo } from "react"

import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Card } from "decentraland-ui/dist/components/Card/Card"

import { SessionEventAttributes } from "../../../entities/Event/types"
import locations from "../../../modules/locations"
import JumpInPosition from "../../Button/JumpInPosition"
import EventDate from "../EventDate/EventDate"

import "./EventCardMini.css"

export type EventCardMiniProps = {
  event?: SessionEventAttributes
  loading?: boolean
  onClick?: (
    e: React.MouseEvent<HTMLAnchorElement>,
    data: SessionEventAttributes
  ) => void
}

export default React.memo(function EventCardMini(props: EventCardMiniProps) {
  const event = props.event
  const onClick = props.onClick
  const href = useMemo(() => event && locations.event(event.id), [event])
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

  const handleJumpIn = useCallback(
    (e: React.MouseEvent<any>) => e.stopPropagation(),
    []
  )

  return (
    <Card
      className={TokenList.join([
        "EventCardMini",
        props.loading && "loading",
        event && !event.approved && "pending",
      ])}
      href={href}
      onClick={handleClick}
    >
      {event && !props.loading && (
        <JumpInPosition event={event} compact onClick={handleJumpIn} />
      )}
      <div style={{ display: "flex" }}>
        <div className="EventCardMini__Cover">
          <ImgFixed src={event?.image || ""} dimension="square" />
          {event && !props.loading && (
            <div className="EventCardMini__Attendees">
              <div className="EventCardMini__Attendees__More">
                +{event.total_attendees}
              </div>
            </div>
          )}
        </div>
        <Card.Content>
          {event && !props.loading && <EventDate event={event} />}
          <Card.Header>{event?.name || " "}</Card.Header>
        </Card.Content>
      </div>
    </Card>
  )
})
