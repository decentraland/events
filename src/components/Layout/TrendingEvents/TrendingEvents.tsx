import React from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Card } from "decentraland-ui/dist/components/Card/Card"

import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCardMini from "../../Event/EventCardMini/EventCardMini"
import { navigateEventDetail } from "../../../modules/events"
import useListEventsTrending from "../../../hooks/useListEventsTrending"
import "./TrendingEvents.css"

export type TrendingEventsProps = {
  className?: string
  events: SessionEventAttributes[]
  loading?: boolean
}

export const TrendingEvents = React.memo(function (props: TrendingEventsProps) {
  const trendingEvents = useListEventsTrending(props.events)

  if (props.loading) {
    return (
      <div className={props.className}>
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

  if (trendingEvents.length === 0) {
    return null
  }

  return (
    <div className={props.className}>
      <div className="trending-events__group-title">
        <SubTitle>TRENDING</SubTitle>
      </div>
      <Card.Group>
        {trendingEvents.map((event) => (
          <EventCardMini
            key={"trending:" + event.id}
            event={event}
            onClick={navigateEventDetail}
          />
        ))}
      </Card.Group>
    </div>
  )
})
