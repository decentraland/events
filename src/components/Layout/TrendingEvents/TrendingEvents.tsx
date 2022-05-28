import React, { useCallback } from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Card } from "decentraland-ui/dist/components/Card/Card"

import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCardMini from "../../Event/EventCardMini/EventCardMini"
import { navigateEventDetail } from "../../../modules/events"
import "./TrendingEvents.css"

export type TrendingEventsProps = {
  className?: string
  events: SessionEventAttributes[]
  loading?: boolean
  hasEvents: boolean
}

export const TrendingEvents = (props: TrendingEventsProps) => {
  const { className, hasEvents, events, loading } = props

  if (loading) {
    return (
      <div className={className}>
        <div className="trending-events__group-title">
          <SubTitle>TRENDING</SubTitle>
        </div>
        <Card.Group>
          <EventCardMini loading />
          <EventCardMini loading />
          <EventCardMini loading />
        </Card.Group>
      </div>
    )
  }

  return (
    <>
      {!loading && hasEvents && events.length > 0 && (
        <div className={className}>
          <div className="trending-events__group-title">
            <SubTitle>TRENDING</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => (
              <EventCardMini
                key={"trending:" + event.id}
                event={event}
                onClick={navigateEventDetail}
              />
            ))}
          </Card.Group>
        </div>
      )}
    </>
  )
}
