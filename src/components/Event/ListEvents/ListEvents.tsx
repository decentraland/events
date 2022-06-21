import React, { useCallback, useMemo } from "react"

import { useLocation } from "@gatsbyjs/reach-router"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { SliderField } from "decentraland-ui/dist/components/SliderField/SliderField"
import {
  ToggleBox,
  ToggleBoxItem,
} from "decentraland-ui/dist/components/ToggleBox/ToggleBox"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"

import { useCategoriesContext } from "../../../context/Category"
import { useProfileSettingsContext } from "../../../context/ProfileSetting"
import {
  EventType,
  SessionEventAttributes,
} from "../../../entities/Event/types"
import { getEventType } from "../../../entities/Event/utils"
import { ALL_EVENT_CATEGORY } from "../../../entities/EventCategory/types"
import useListEventsByMonth from "../../../hooks/useListEventsByMonth"
import useListEventsCategories from "../../../hooks/useListEventsCategories"
import useListEventsFiltered from "../../../hooks/useListEventsFiltered"
import { showTimezoneLabel } from "../../../modules/date"
import { EventFilters, fromEventFilters, url } from "../../../modules/locations"
import { SegmentEvent } from "../../../modules/segment"
import { NoEvents } from "../NoEvents/NoEvents"
import { ListMonthEvents } from "./ListMonthEvents"

import "./ListEvents.css"

export type ListEventsProps = {
  events: SessionEventAttributes[]
  filters: EventFilters
  loading?: boolean
  className?: string
  disabledFilters?: boolean
}

const typeItems = [
  {
    title: "All events",
    description: "Every event in Decentraland",
    value: EventType.All,
  },
  {
    title: "One time event",
    description: "Events which happen once",
    value: EventType.One,
  },
  {
    title: "Recurring event",
    description: "Events which happen on more than one day",
    value: EventType.Recurrent,
  },
]

export const ListEvents = React.memo((props: ListEventsProps) => {
  const { loading, disabledFilters } = props
  const [settings] = useProfileSettingsContext()
  const location = useLocation()
  const track = useTrackContext()
  const l = useFormatMessage()
  const [categories] = useCategoriesContext()
  const filteredEvents = useListEventsFiltered(
    props.events,
    props.filters,
    settings
  )
  const eventsByMonth = useListEventsByMonth(filteredEvents)
  const categoriesFiltered = useListEventsCategories(props.events, categories)

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
  }, [categoriesFiltered, props.filters.category])

  const timeRangeLabel = useMemo(() => {
    const from =
      props.filters.timeFrom === 24 * 60
        ? "24:00"
        : Time.duration(props.filters.timeFrom ?? 0, "minutes").format("HH:mm")
    const to =
      props.filters.timeTo === 24 * 60 || props.filters.timeTo === undefined
        ? "24:00"
        : Time.duration(props.filters.timeTo, "minutes").format("HH:mm")

    const timezone = showTimezoneLabel(Time.from(), settings?.use_local_time)
    return `${from} - ${to} ${timezone}`
  }, [props.filters])

  const timeRangeValue = useMemo(
    () =>
      [
        (props.filters.timeFrom ?? 0) / 30,
        (props.filters.timeTo ?? 24 * 60) / 30,
      ] as const,
    [props.filters]
  )

  const showFilters = !loading && !disabledFilters
  const itemsPerRow = showFilters ? 2 : 3

  const handleTypeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const type = getEventType(item.value as string)
      const newFilters = { ...props.filters, type }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    [location.pathname, location.search, props.filters]
  )

  const handleCategoryChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const category = item.value as string
      const newFilters = { ...props.filters, category }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    [location.pathname, location.search, props.filters]
  )

  const handleRangeChange = useCallback(
    (
      ev: React.ChangeEvent<HTMLInputElement>,
      [from, to]: readonly [number, number]
    ) => {
      const newFilters = {
        ...props.filters,
        timeFrom: from * 30,
        timeTo: to * 30,
      }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    []
  )

  const handleRangeAfterChange = useCallback(
    (
      ev: React.MouseEvent<HTMLInputElement, MouseEvent>,
      [from, to]: readonly [number, number]
    ) => {
      const newFilters = {
        ...props.filters,
        timeFrom: from * 30,
        timeTo: to * 30,
      }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    []
  )

  return (
    <Grid stackable>
      <Grid.Row>
        {showFilters && (
          <Grid.Column tablet={4}>
            <ToggleBox
              header="Type"
              onClick={handleTypeChange}
              items={typeItems}
              value={props.filters.type}
            />

            {categoriesFiltered.length > 0 && (
              <ToggleBox
                header="Category"
                onClick={handleCategoryChange}
                items={categoryItems}
                value={props.filters.category || ALL_EVENT_CATEGORY}
                borderless
              />
            )}

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
          </Grid.Column>
        )}
        <Grid.Column tablet={showFilters ? 12 : 16}>
          {loading && <ListMonthEvents loading itemsPerRow={itemsPerRow} />}

          {!loading &&
            eventsByMonth.length > 0 &&
            eventsByMonth.map(([date, events]) => {
              return (
                <ListMonthEvents
                  key={date.toJSON()}
                  date={date}
                  events={events}
                  itemsPerRow={itemsPerRow}
                />
              )
            })}

          {!loading && filteredEvents.length === 0 && (
            <NoEvents>{l("page.events.not_found")}</NoEvents>
          )}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
})
