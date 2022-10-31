import React, { useCallback, useMemo } from "react"

import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { SessionEventAttributes } from "../../../entities/Event/types"
import {
  ScheduleAttributes,
  ScheduleTheme,
} from "../../../entities/Schedule/types"
import { getScheduleBackground } from "../../../entities/Schedule/utils"
import useListEventsMain from "../../../hooks/useListEventsMain"
import mvmfImage from "../../../images/mvmf.jpg"
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
    () =>
      schedule && schedule.theme === null
        ? { background: getScheduleBackground(schedule) }
        : {},
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
    <ContainerWrapper
      style={style}
      className={TokenList.join([
        "carousel-events__container-wrapper",
        !!schedule?.theme && "carousel-events--" + schedule.theme,
      ])}
    >
      <Container>
        {props.loading && (
          <Carousel>
            <EventCardBig loading />
          </Carousel>
        )}
        {!props.loading && schedule && schedule.theme === null && (
          <SubTitle className="carousel-events__title">
            {schedule.name}
          </SubTitle>
        )}
        {!props.loading &&
          schedule &&
          schedule.theme === ScheduleTheme.MetaverseFestival2022 && (
            <div
              className={
                "carousel-events__title--" + ScheduleTheme.MetaverseFestival2022
              }
            >
              <img src={mvmfImage} width="930" height="290" />
              <Button
                as="a"
                href={locations.schedule(schedule.id)}
                onClick={handleClickFullSchedule}
              >
                View line up
              </Button>
            </div>
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
        {!props.loading && schedule && schedule.theme === null && (
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
