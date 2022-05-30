import React, { useCallback, useMemo, useState } from "react"

import { useLocation } from "@gatsbyjs/reach-router"

import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { SliderField } from "decentraland-ui/dist/components/SliderField/SliderField"
import {
  ToggleBox,
  ToggleBoxItem,
} from "decentraland-ui/dist/components/ToggleBox/ToggleBox"

import { useCategoriesContext } from "../../../context/Category"
import { useEventIdContext } from "../../../context/Event"
import { useProfileSettingsContext } from "../../../context/ProfileSetting"
import {
  EventTimeParams,
  SessionEventAttributes,
  ToggleItemsValue,
} from "../../../entities/Event/types"
import { getEventTime, getEventType } from "../../../entities/Event/utils"
import useListEventsByMonth from "../../../hooks/useListEventsByMonth"
import useListEventsCategories from "../../../hooks/useListEventsCategories"
import { showTimezoneLabel } from "../../../modules/date"
import { navigateEventDetail } from "../../../modules/events"
import {
  FilterCategoryVariant,
  FilterTimeVariant,
  FilterTypeVariant,
  Flags,
} from "../../../modules/features"
import { url } from "../../../modules/locations"
import { SegmentEvent } from "../../../modules/segment"
import EventCard from "../../Event/EventCard/EventCard"
import { Column } from "../Column/Column"
import { Row } from "../Row/Row"
import "./ListEvents.css"

export type ListEventsProps = {
  events: SessionEventAttributes[]
  hasEvents: boolean
  params: URLSearchParams
  loading?: boolean
  className?: string
  hideFilter?: boolean
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

export const ListEvents = (props: ListEventsProps) => {
  const { className, hasEvents, events, loading, params, hideFilter } = props
  const eventsByMonth = useListEventsByMonth(events)
  const [settings] = useProfileSettingsContext()
  const location = useLocation()
  const track = useTrackContext()
  const l = useFormatMessage()
  const [ff] = useFeatureFlagContext()
  const [categories] = useCategoriesContext()
  const categoriesFiltered = useListEventsCategories(events, categories)

  const [event] = useEventIdContext(params.get("event"))
  const typeFilter = getEventType(params.get("type"))

  const timeFilter = getEventTime(
    params.get("time-from"),
    params.get("time-to")
  )

  const [eventTime, setEventTime] = useState<EventTimeParams>(timeFilter)

  const categoryItems = useMemo(() => {
    let categoriesToReturn = [
      {
        title: "All",
        description: "",
        value: "all",
      },
    ]

    if (categoriesFiltered) {
      const categoriesOptions = categoriesFiltered?.map((category) => ({
        title: l(`page.events.categories.${category.name}`),
        description: "",
        value: category.name,
      }))

      categoriesToReturn = [...categoriesToReturn, ...categoriesOptions]
    }

    return categoriesToReturn
  }, [categoriesFiltered, params.get("category")])

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
      ) === FilterCategoryVariant.enabled && categoriesFiltered.length > 0,
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
    hasEvents &&
    !hideFilter &&
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
      navigate(url(location.pathname, newParams))
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
      navigate(url(location.pathname, newParams))
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
      navigate(url(location.pathname, newParams))
    },
    []
  )

  if (loading) {
    return (
      <div className={className}>
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
      </div>
    )
  }

  return (
    <>
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
            {!loading && hasEvents && events.length === 0 && (
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
                        onClick={navigateEventDetail}
                      />
                    ))}
                  </Card.Group>
                </div>
              ))}
          </Column>
        </Row>
      )}
    </>
  )
}
