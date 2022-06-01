import React, { useCallback, useMemo } from "react"

import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Button } from "decentraland-ui/dist/components/Button/Button"

import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCardBig from "../../Event/EventCardBig/EventCardBig"
import { navigateEventDetail } from "../../../modules/events"
import { ScheduleAttributes } from "../../../entities/Schedule/types"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import locations from "../../../modules/locations"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { getScheduleBackground } from "../../../entities/Schedule/utils"
import "./CarouselEvents.css"

export type CarouselEventsProps = {
  className?: string
  loading?: boolean
  events?: SessionEventAttributes[]
  schedule?: ScheduleAttributes
}

export const CarouselEvents = React.memo((props: CarouselEventsProps) => {
  const { loading, schedule } = props

  const className = TokenList.join([
    "carousel-events__wrapper",
    schedule && "carousel-events__wrapper__schedule-hightlight",
    props.className,
  ])

  const style = useMemo(
    () => (schedule ? { background: getScheduleBackground(schedule) } : {}),
    [schedule]
  )

  const events = useMemo(
    () =>
      props.events && schedule
        ? props.events.filter((event) => event.schedules.includes(schedule.id))
        : props.events,
    [props.events, schedule]
  )

  const handleClickFullSchedule = useCallback(
    prevent(() => schedule && navigate(locations.schedule(schedule.id))),
    [schedule]
  )

  if (loading) {
    return (
      <div className={className} style={style}>
        <Container>
          <Carousel>
            <EventCardBig loading />
          </Carousel>
        </Container>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return null
  }

  return (
    <div className={className} style={style}>
      <Container>
        {schedule && (
          <SubTitle className="carousel-events__title">
            {schedule.name}
          </SubTitle>
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
        {schedule && (
          <div className="carousel-events__action-wrapper">
            <Button
              primary
              as="a"
              href={locations.schedule(schedule.id)}
              onClick={handleClickFullSchedule}
            >
              Full Schedule
            </Button>
          </div>
        )}
      </Container>
    </div>
  )
})
