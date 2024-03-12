import React, { useCallback, useMemo } from "react"

import { withPrefix } from "gatsby"

import Carousel2 from "decentraland-gatsby/dist/components/Carousel2/Carousel2"
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
import mvfwLogo from "../../../images/mvfw.svg"
import mvmfLogo from "../../../images/mvmf.jpg"
import prideLogo from "../../../images/pride-2023.png"
import { navigateEventDetail } from "../../../modules/events"
import locations from "../../../modules/locations"
import ContainerWrapper from "../../Layout/ContainerWrapper"
import EventCardBig from "../EventCardBig/EventCardBig"

import "./CarouselEvents.css"

export type CarouselEventsProps = {
  loading?: boolean
  hideGoToSchedule?: boolean
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
        !!schedule?.theme && "carousel-events--with-theme",
        !!schedule?.theme && "carousel-events--" + schedule.theme,
      ])}
    >
      <Container>
        {!props.loading && schedule && schedule.theme === null && (
          <SubTitle className="carousel-events__title">
            {schedule.name}
          </SubTitle>
        )}
        {<CarouselThemeHeader schedule={schedule} />}
        <Carousel2
          loading={props.loading}
          items={mainEvents}
          component={CarouselEventItem}
        />
        {!props.loading &&
          schedule &&
          !schedule?.theme &&
          !props.hideGoToSchedule && (
            <div className="carousel-events__action-wrapper">
              <Button
                primary
                as="a"
                href={withPrefix(locations.schedule(schedule.id))}
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

const CarouselEventItem = React.memo(function CarouselEventItem({
  item,
}: {
  item: SessionEventAttributes
}) {
  return (
    <EventCardBig
      key={"live:" + item.id}
      event={item}
      onClick={navigateEventDetail}
    />
  )
})

const CarouselThemeHeaderLogo = {
  [ScheduleTheme.MetaverseFashionWeek2023]: (
    <img src={mvfwLogo} width="342" height="89" />
  ),
  [ScheduleTheme.MetaverseFestival2022]: (
    <img src={mvmfLogo} width="930" height="290" />
  ),
  [ScheduleTheme.PrideWeek2023]: (
    <img src={prideLogo} width="271" height="100" />
  ),
}

const CarouselThemeHeaderCTA = {
  [ScheduleTheme.MetaverseFashionWeek2023]: "view the agenda",
  [ScheduleTheme.MetaverseFestival2022]: "view line up",
  [ScheduleTheme.PrideWeek2023]: "view the agenda",
}

const CarouselThemeHeader = React.memo(function CarouselThemeHeader({
  schedule,
}: {
  schedule?: ScheduleAttributes
}) {
  const handleClickFullSchedule = useCallback(
    prevent(() => schedule && navigate(locations.schedule(schedule.id))),
    [schedule]
  )

  if (!schedule?.theme) {
    return null
  }

  return (
    <div
      className={
        "carousel-events__title carousel-events__title--" + schedule.theme
      }
    >
      {CarouselThemeHeaderLogo[schedule.theme]}
      <Button
        as="a"
        primary
        href={withPrefix(locations.schedule(schedule.id))}
        onClick={handleClickFullSchedule}
      >
        {CarouselThemeHeaderCTA[schedule.theme]}
      </Button>
    </div>
  )
})
