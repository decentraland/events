import React from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Card } from "decentraland-ui/dist/components/Card/Card"

import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCardMini from "../../Event/EventCardMini/EventCardMini"
import "./TrendingEvents.css"

export type TrendingEventsProps = {
  className?: string
  events: SessionEventAttributes[]
  loading?: boolean
  hasEvents: boolean
  onClick: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    data: SessionEventAttributes
  ) => void
}

export const TrendingEvents = (props: TrendingEventsProps) => {
  const { className, hasEvents, events, loading, onClick } = props

  if (loading) {
    return (
      <div className={className}>
        <div>
          <div className="trending-events__group-title">
            <SubTitle>TRENDING</SubTitle>
          </div>
          <Card.Group>
            <EventCardMini loading />
            <EventCardMini loading />
            <EventCardMini loading />
          </Card.Group>
        </div>
      </div>
    )
  }

  return (
    <>
      {!loading && hasEvents && events.length > 0 && (
        <div className={className}>
          <div>
            <div className="trending-events__group-title">
              <SubTitle>TRENDING</SubTitle>
            </div>
            <Card.Group>
              {events.map((event) => (
                <EventCardMini
                  key={"trending:" + event.id}
                  event={event}
                  onClick={onClick}
                />
              ))}
            </Card.Group>
          </div>
        </div>
      )}
    </>
  )
}
