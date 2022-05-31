import React, { useCallback } from "react"

import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCardBig from "../../Event/EventCardBig/EventCardBig"
import { navigateEventDetail } from "../../../modules/events"
import "./CarouselEvents.css"

export type CarouselEventsProps = {
  className?: string
  events: SessionEventAttributes[]
  loading?: boolean
  hasEvents: boolean
  searching?: boolean
  action?: React.ReactNode
  title?: string
}

export const CarouselEvents = (props: CarouselEventsProps) => {
  const { className, hasEvents, events, loading, searching, action, title } =
    props
  const classes = ["carousel-events__wrapper"]
  className && classes.push(className)

  if (action && title) {
    classes.push("carousel-events__wrapper__schedule-hightlight")
  }

  if (loading) {
    return (
      <div className={classes.join(" ")}>
        <Container>
          <Carousel>
            <EventCardBig loading />
          </Carousel>
        </Container>
      </div>
    )
  }

  return (
    <>
      {!loading && !searching && hasEvents && events.length > 0 && (
        <div className={classes.join(" ")}>
          <Container>
            {title && (
              <SubTitle className="carousel-events__title">{title}</SubTitle>
            )}
            <Carousel>
              {events.map((event) => (
                <EventCardBig
                  key={"live:" + event.id}
                  event={event}
                  onClick={navigateEventDetail}
                />
              ))}
            </Carousel>
            {action && (
              <div className="carousel-events__action-wrapper">{action}</div>
            )}
          </Container>
        </div>
      )}
    </>
  )
}
