import React, { useMemo, useState, useCallback } from "react"
import Helmet from "react-helmet"
import { useLocation } from "@gatsbyjs/reach-router"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import {
  ToggleBox,
  ToggleBoxItem,
} from "decentraland-ui/dist/components/ToggleBox/ToggleBox"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import EventCardBig from "../components/Event/EventCardBig/EventCardBig"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"

import useListEventsByMonth from "../hooks/useListEventsByMonth"

import locations from "../modules/locations"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import {
  useEventIdContext,
  useEventsContext,
  useEventSorter,
} from "../context/Event"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import {
  EventTimeParams,
  SessionEventAttributes,
  ToggleItemsValue,
} from "../entities/Event/types"
import useListEventsFiltered from "../hooks/useListEventsFiltered"
import useListEventsMain from "../hooks/useListEventsMain"
import useListEventsTrending from "../hooks/useListEventsTrending"
import "./index.css"
import { Column } from "../components/Layout/Column/Column"
import { Row } from "../components/Layout/Row/Row"
import {
  FilterCategoryVariant,
  FilterTimeVariant,
  FilterTypeVariant,
  Flags,
} from "../modules/features"
import { getEventTime, getEventType } from "../entities/Event/utils"
import { SegmentEvent } from "../modules/segment"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import { getCategoriesFetch } from "../modules/events"
import useListEventsCategories from "../hooks/useListEventsCategories"
import Range from "../components/Range/Range"
import { showTimezoneLabel } from "../modules/date"

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
        active: !params.get("category") || params.get("category") == "all",
        value: "all",
      },
    ]

    if (categoriesUsed) {
      const categoriesOptions = categoriesUsed?.map((category) => ({
        title: l(`page.events.categories.${category.name}`),
        description: "",
        active: params.get("category") === category.name,
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

  console.log(
    ff.name<FilterTypeVariant>(
      Flags.FilterTypeVariant,
      FilterTypeVariant.disabled
    ),
    ff.name<FilterCategoryVariant>(
      Flags.FilterCategoryVariant,
      FilterCategoryVariant.disabled
    ),
    ff.name<FilterTimeVariant>(
      Flags.FilterTimeVariant,
      FilterTimeVariant.disabled
    )
  )

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

  const handleRangeChange = useCallback((valueArray: [number, number]) => {
    const from = Time.from((Time.Hour / 2) * valueArray[0], {
      utc: true,
    }).format("HHmm")
    const to = Time.from((Time.Hour / 2) * valueArray[1], { utc: true }).format(
      "HHmm"
    )

    const eventTimeData = getEventTime(
      valueArray[0] === 48 ? "2400" : from,
      valueArray[1] === 48 ? "2400" : to
    )
    setEventTime(eventTimeData)
  }, [])

  const handleRangeAfterChange = useCallback((valueArray: [number, number]) => {
    const from = Time.from((Time.Hour / 2) * valueArray[0], {
      utc: true,
    }).format("HHmm")
    const to = Time.from((Time.Hour / 2) * valueArray[1], { utc: true }).format(
      "HHmm"
    )
    const newParams = new URLSearchParams(params)
    newParams.set("time-from", valueArray[0] === 48 ? "2400" : from)
    newParams.set("time-to", valueArray[1] === 48 ? "2400" : to)
    navigate(locations.events(newParams))
  }, [])

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
            <Carousel>
              <EventCardBig loading />
            </Carousel>
          </div>
        )}

        {!loading && !searching && events.length > 0 && mainEvents.length > 0 && (
          <div>
            <Carousel>
              {mainEvents.map((event) => (
                <EventCardBig
                  key={"live:" + event.id}
                  event={event}
                  onClick={handleEventClick}
                />
              ))}
            </Carousel>
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
                  // TODO: move to `decentraland-ui`
                  <div className={"dcl box borderless"}>
                    <div className={"dcl box-header"}>Tag</div>
                    <div className={"dcl box-children"}>
                      {categoryItems.map((item, index) => {
                        const classesItem = ["dcl", "togglebox-item"]
                        if (
                          (params.get("category") &&
                            params.get("category") === item.value) ||
                          (!params.get("category") && item.value == "all")
                        ) {
                          classesItem.push("active")
                        }
                        return (
                          <div
                            key={index}
                            className={classesItem.join(" ")}
                            onClick={(event) =>
                              handleCategoryChange(event, item)
                            }
                          >
                            <div className={"dcl togglebox-item-title"}>
                              {item.title}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {showFilterByTime && (
                  // TODO: move to `decentraland-ui`
                  <Range
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
