import React from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { SessionEventAttributes } from "../../../entities/Event/types"
import useListEventsTrending from "../../../hooks/useListEventsTrending"
import { navigateEventDetail } from "../../../modules/events"
import EventCardMini from "../EventCardMini/EventCardMini"

import "./TrendingEvents.css"

export type TrendingEventsProps = {
  events?: SessionEventAttributes[]
  loading?: boolean
}

export const TrendingEvents = React.memo(function (props: TrendingEventsProps) {
  const trendingEvents = useListEventsTrending(props.events)
  if (!props.loading && !trendingEvents?.length) {
    return null
  }

  return (
    <Container>
      <div className="trending-events__group-title">
        <SubTitle>TRENDING</SubTitle>
      </div>

      <Card.Group>
        {props.loading && <EventCardMini loading />}
        {props.loading && <EventCardMini loading />}
        {props.loading && <EventCardMini loading />}
        {!props.loading &&
          trendingEvents.map((event) => (
            <EventCardMini
              key={"trending:" + event.id}
              event={event}
              onClick={navigateEventDetail}
            />
          ))}
      </Card.Group>
    </Container>
  )
})
