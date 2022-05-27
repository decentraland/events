import React, { useCallback, useMemo, useState } from "react"
import Helmet from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"

import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { SliderField } from "decentraland-ui/dist/components/SliderField/SliderField"
import {
  ToggleBox,
  ToggleBoxItem,
} from "decentraland-ui/dist/components/ToggleBox/ToggleBox"

import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import EventModal from "../components/Event/EventModal/EventModal"
import { CarouselEvents } from "../components/Layout/CarouselEvents/CarouselEvents"
import { Column } from "../components/Layout/Column/Column"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import { Row } from "../components/Layout/Row/Row"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"

import {
  useEventIdContext,
  useEventSorter,
  useEventsContext,
} from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import {
  EventTimeParams,
  SessionEventAttributes,
  ToggleItemsValue,
} from "../entities/Event/types"
import { getEventTime, getEventType } from "../entities/Event/utils"
import useListEventsByMonth from "../hooks/useListEventsByMonth"
import useListEventsCategories from "../hooks/useListEventsCategories"
import useListEventsFiltered from "../hooks/useListEventsFiltered"
import useListEventsMain from "../hooks/useListEventsMain"
import useListEventsTrending from "../hooks/useListEventsTrending"
import { showTimezoneLabel } from "../modules/date"
import { getCategoriesFetch } from "../modules/events"
import {
  FilterCategoryVariant,
  FilterTimeVariant,
  FilterTypeVariant,
  Flags,
} from "../modules/features"
import locations from "../modules/locations"
import { SegmentEvent } from "../modules/segment"
import "./index.css"

export type IndexPageState = {
  updating: Record<string, boolean>
}

const typeItems = [
  {
    title: "All events",
    description: "Every event in Decentraland",
    value: ToggleItemsValue.All,
  },
  {
    title: "One time event",
    description: "Events which happen once",
    value: ToggleItemsValue.One,
  },
  {
    title: "Recurring event",
    description: "Events which happen on more than one day",
    value: ToggleItemsValue.Recurrent,
  },
]

export default function IndexPage() {
  const l = useFormatMessage()
  const [, accountState] = useAuthContext()
  const location = useLocation()
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const [event] = useEventIdContext(params.get("event"))
  const [settings] = useProfileSettingsContext()
  const [all, state] = useEventsContext()
  const track = useTrackContext()
  const events = useEventSorter(all)
  const [ff] = useFeatureFlagContext()
  const loading = accountState.loading || state.loading
  const searching = !!params.get("search")
  const typeFilter = getEventType(params.get("type"))

  const timeFilter = getEventTime(
    params.get("time-from"),
    params.get("time-to")
  )

  const [categories] = useAsyncMemo(getCategoriesFetch)

  const filteredEvents = useListEventsFiltered(
    events,
    {
      search: params.get("search"),
      categories: params.get("category"),
      type: typeFilter,
      time: timeFilter,
    },
    settings
  )

  const eventsByMonth = useListEventsByMonth(filteredEvents)
  const trendingEvents = useListEventsTrending(filteredEvents)
  const mainEvents = useListEventsMain(filteredEvents)
  const categoriesUsed = useListEventsCategories(events, categories)

  const [enabledNotification, setEnabledNotification] = useState(false)
  const [eventTime, setEventTime] = useState<EventTimeParams>(timeFilter)

  const categoryItems = useMemo(() => {
    let categoriesToReturn = [
      {
        title: "All",
        description: "",
        value: "all",
      },
    ]

    if (categoriesUsed) {
      const categoriesOptions = categoriesUsed?.map((category) => ({
        title: l(`page.events.categories.${category.name}`),
        description: "",
        value: category.name,
      }))

      categoriesToReturn = [...categoriesToReturn, ...categoriesOptions]
    }

    return categoriesToReturn
  }, [categoriesUsed, params.get("category")])

  const timeRangeLabel = useMemo(() => {
    const from =
      eventTime.start == 1440
        ? "24:00"
        : Time.duration(eventTime.start, "minutes").format("HH:mm")
    const to =
      eventTime.end == 1440
        ? "24:00"
        : Time.duration(eventTime.end, "minutes").format("HH:mm")
    const timezone = showTimezoneLabel(
      Time.from(event?.start_at),
      settings?.use_local_time
    )
    return `${from} - ${to} ${timezone}`
  }, [eventTime])

  const timeRangeValue = useMemo(() => {
    return [timeFilter.start / 30, timeFilter.end / 30] as const
  }, [timeFilter])

  const showFilterByType = useMemo(
    () =>
      ff.name<FilterTypeVariant>(
        Flags.FilterTypeVariant,
        FilterTypeVariant.disabled
      ) === FilterTypeVariant.enabled,
    [ff]
  )

  const showFilterByCategory = useMemo(
    () =>
      ff.name<FilterCategoryVariant>(
        Flags.FilterCategoryVariant,
        FilterCategoryVariant.disabled
      ) === FilterCategoryVariant.enabled && categoriesUsed.length > 0,
    [ff]
  )

  const showFilterByTime = useMemo(
    () =>
      ff.name<FilterTimeVariant>(
        Flags.FilterTimeVariant,
        FilterTimeVariant.disabled
      ) === FilterTimeVariant.enabled,
    [ff]
  )

  const showFilters =
    events.length > 0 &&
    (showFilterByType || showFilterByTime || showFilterByCategory)
  const cardItemsPerRow = showFilters ? 2 : 3

  const handleTypeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const newParams = new URLSearchParams(params)

      const type = getEventType((item as any).value)
      if (type === ToggleItemsValue.All) {
        newParams.delete("type")
      } else {
        newParams.set("type", type)
      }

      track(SegmentEvent.Filter, { type })
      navigate(locations.events(newParams))
    },
    [location.pathname, params]
  )

  const handleCategoryChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const newParams = new URLSearchParams(params)

      const category = (item as any).value

      if (category === "All") {
        newParams.delete("category")
      } else {
        newParams.set("category", category)
      }

      track(SegmentEvent.Filter, { category })
      navigate(locations.events(newParams))
    },
    [location.pathname, params, ff]
  )

  const handleRangeChange = useCallback(
    (
      ev: React.ChangeEvent<HTMLInputElement>,
      valueArray: readonly [number, number]
    ) => {
      const from = Time.from((Time.Hour / 2) * valueArray[0], {
        utc: true,
      }).format("HHmm")
      const to = Time.from((Time.Hour / 2) * valueArray[1], {
        utc: true,
      }).format("HHmm")

      const eventTimeData = getEventTime(
        valueArray[0] === 48 ? "2400" : from,
        valueArray[1] === 48 ? "2400" : to
      )
      setEventTime(eventTimeData)
    },
    []
  )

  const handleRangeAfterChange = useCallback(
    (
      ev: React.MouseEvent<HTMLInputElement, MouseEvent>,
      valueArray: readonly [number, number]
    ) => {
      const from = Time.from((Time.Hour / 2) * valueArray[0], {
        utc: true,
      }).format("HHmm")
      const to = Time.from((Time.Hour / 2) * valueArray[1], {
        utc: true,
      }).format("HHmm")
      const newParams = new URLSearchParams(params)
      newParams.set("time-from", valueArray[0] === 48 ? "2400" : from)
      newParams.set("time-to", valueArray[1] === 48 ? "2400" : to)
      navigate(locations.events(newParams))
    },
    []
  )

  const handleEventClick = useCallback(
    (e: React.MouseEvent<any>, event: SessionEventAttributes) => {
      e.stopPropagation()
      e.preventDefault()
      navigate(locations.event(event.id))
    },
    []
  )

  return (
    <>
      <Helmet>
        <title>{event?.name || l("social.home.title") || ""}</title>
        <meta
          name="description"
          content={event?.description || l("social.home.description") || ""}
        />

        <meta
          property="og:title"
          content={event?.name || l("social.home.title") || ""}
        />
        <meta
          property="og:description"
          content={event?.description || l("social.home.description") || ""}
        />
        <meta
          property="og:image"
          content={event?.image || l("social.home.image") || ""}
        />
        <meta property="og:site" content={l("social.home.site") || ""} />

        <meta
          name="twitter:title"
          content={event?.description || l("social.home.title") || ""}
        />
        <meta
          name="twitter:description"
          content={event?.description || l("social.home.description") || ""}
        />
        <meta
          name="twitter:image"
          content={event?.image || l("social.home.image") || ""}
        />
        <meta
          name="twitter:card"
          content={event ? "summary_large_image" : l("social.home.card") || ""}
        />
        <meta name="twitter:creator" content={l("social.home.creator") || ""} />
        <meta name="twitter:site" content={l("social.home.site") || ""} />
      </Helmet>
      <EnabledNotificationModal
        open={enabledNotification}
        onClose={() => setEnabledNotification(false)}
      />
      <EventModal
        event={event}
        onClose={prevent(() => navigate(locations.events()))}
      />
      <Navigation activeTab={NavigationTab.Events} search />

      <CarouselEvents
        events={mainEvents}
        onClick={handleEventClick}
        loading={loading}
        searching={searching}
        hasEvents={events.length > 0}
        action={<Button primary>View More</Button>}
        title={"Pride"}
      />

      <Container>
        {!loading && events.length === 0 && (
          <div>
            <Divider />
            <Paragraph secondary style={{ textAlign: "center" }}>
              {l("page.events.no_events")}
            </Paragraph>
            <Divider />
          </div>
        )}

        {loading && (
          <div>
            <div className="GroupTitle">
              <SubTitle>TRENDING</SubTitle>
            </div>
            <Card.Group>
              <EventCardMini loading />
              <EventCardMini loading />
              <EventCardMini loading />
            </Card.Group>
          </div>
        )}

        {!loading && events.length > 0 && trendingEvents.length > 0 && (
          <div>
            <div className="GroupTitle">
              <SubTitle>TRENDING</SubTitle>
            </div>
            <Card.Group>
              {trendingEvents.map((event) => (
                <EventCardMini
                  key={"trending:" + event.id}
                  event={event}
                  onClick={handleEventClick}
                />
              ))}
            </Card.Group>
          </div>
        )}

        {loading && (
          <div>
            <div className="GroupTitle">
              <SubTitle>
                {Time.from(Date.now(), {
                  utc: !settings?.use_local_time,
                }).format("MMMM")}
              </SubTitle>
            </div>
            <Card.Group>
              <EventCard loading />
              <EventCard loading />
              <EventCard loading />
              <EventCard loading />
              <EventCard loading />
              <EventCard loading />
            </Card.Group>
          </div>
        )}

        {!loading && (
          <Row>
            {showFilters && (
              <Column align="left" className="sidebar">
                {showFilterByType && (
                  <ToggleBox
                    header="Type"
                    onClick={handleTypeChange}
                    items={typeItems}
                    value={typeFilter}
                  />
                )}

                {showFilterByCategory && (
                  <ToggleBox
                    header="Category"
                    onClick={handleCategoryChange}
                    items={categoryItems}
                    value={params.get("category") || "all"}
                    borderless
                  />
                )}

                {showFilterByTime && (
                  <SliderField
                    range={true}
                    header="Event Time"
                    min={0}
                    max={48}
                    defaultValue={timeRangeValue}
                    onChange={handleRangeChange}
                    onMouseUp={handleRangeAfterChange}
                    label={timeRangeLabel}
                  />
                )}
              </Column>
            )}
            <Column align="right" grow={true}>
              {!loading && events.length > 0 && filteredEvents.length === 0 && (
                <div>
                  <Divider />
                  <Paragraph secondary style={{ textAlign: "center" }}>
                    {l("page.events.not_found")}
                  </Paragraph>
                  <Divider />
                </div>
              )}

              {eventsByMonth.length > 0 &&
                eventsByMonth.map(([date, events]) => (
                  <div key={"month:" + date.toJSON()}>
                    <div className="GroupTitle">
                      <SubTitle>
                        {Time.from(date, {
                          utc: !settings?.use_local_time,
                        }).format("MMMM")}
                      </SubTitle>
                    </div>
                    <Card.Group itemsPerRow={cardItemsPerRow}>
                      {events.map((event) => (
                        <EventCard
                          key={"event:" + event.id}
                          event={event}
                          onClick={handleEventClick}
                        />
                      ))}
                    </Card.Group>
                  </div>
                ))}
            </Column>
          </Row>
        )}
      </Container>
    </>
  )
}
