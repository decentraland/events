import React, { useCallback, useMemo } from "react"

import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { SessionEventAttributes } from "../../../entities/Event/types"
import { ScheduleAttributes } from "../../../entities/Schedule/types"
import { getScheduleBackground } from "../../../entities/Schedule/utils"
import useListEventsMain from "../../../hooks/useListEventsMain"
import { navigateEventDetail } from "../../../modules/events"
import locations from "../../../modules/locations"
import ContainerWrapper from "../../Layout/ContainerWrapper"
import EventCardBig from "../EventCardBig/EventCardBig"

import "./CarouselEvents.css"

export type CarouselEventsProps = {
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

  if (!props.loading && !mainEvents?.length) {
    return null
  }

  return (
    <ContainerWrapper style={style}>
      <Container>
        {schedule && (
          <SubTitle className="carousel-events__title">
            {schedule.name}
          </SubTitle>
        )}
        {props.loading && (
          <Carousel>
            <EventCardBig loading />
          </Carousel>
        )}
        {!props.loading && (
          <Carousel>
            {mainEvents.map((event) => (
              <EventCardBig
                key={"live:" + event.id}
                event={event}
                onClick={navigateEventDetail}
              />
            ))}
          </Carousel>
        )}
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
    </ContainerWrapper>
  )
})
