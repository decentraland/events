import React, { useCallback, useMemo } from "react"

import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Button } from "decentraland-ui/dist/components/Button/Button"

import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCardBig from "../EventCardBig/EventCardBig"
import { navigateEventDetail } from "../../../modules/events"
import { ScheduleAttributes } from "../../../entities/Schedule/types"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import locations from "../../../modules/locations"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { getScheduleBackground } from "../../../entities/Schedule/utils"
import useListEventsMain from "../../../hooks/useListEventsMain"
import "./CarouselEvents.css"

export type CarouselEventsProps = {
  className?: string
  loading?: boolean
  events?: SessionEventAttributes[]
  schedule?: ScheduleAttributes
}

export const CarouselEvents = React.memo((props: CarouselEventsProps) => {
  const schedule = useMemo(() => {
    if (!props.schedule || !props.events) {
      return props.schedule
    }

    const scheduleHasEvents = props.events.find(
      (event) =>
        event.highlighted && event.schedules.includes(props.schedule!.id)
    )
    if (scheduleHasEvents) {
      return props.schedule
    }

    return undefined
  }, [props.events, props.schedule])

  const className = useMemo(
    () =>
      TokenList.join([
        "carousel-events__wrapper",
        schedule && "carousel-events__wrapper__schedule-hightlight",
        props.className,
      ]),
    [schedule, props.className]
  )

  const style = useMemo(
    () => (schedule ? { background: getScheduleBackground(schedule) } : {}),
    [schedule]
  )

  const events = useMemo(
    () =>
      props.events && schedule
        ? props.events.filter(
            (event) =>
              event.highlighted && event.schedules.includes(schedule.id)
          )
        : props.events || [],
    [props.events, schedule]
  )

  const mainEvents = useListEventsMain(
    events.length > 0 ? events : props.events
  )

  const handleClickFullSchedule = useCallback(
    prevent(() => schedule && navigate(locations.schedule(schedule.id))),
    [schedule]
  )

  if (props.loading) {
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

  if (!mainEvents || mainEvents.length === 0) {
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
          {mainEvents.map((event) => (
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
