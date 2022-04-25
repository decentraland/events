import React, {
  useMemo,
  useState,
  Fragment,
  useCallback,
  useEffect,
} from "react"
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
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import {
  SessionEventAttributes,
  ToggleItemsValue,
} from "../entities/Event/types"
import useListEventsFiltered from "../hooks/useListEventsFiltered"
import useListEventsMain from "../hooks/useListEventsMain"
import useListEventsTrending from "../hooks/useListEventsTrending"
import "./index.css"
import { Column } from "../components/Layout/Column/Column"
import { Row } from "../components/Layout/Row/Row"
import { FeatureFlags } from "../modules/features"
import { getEventType } from "../entities/Event/utils"
import track from "decentraland-gatsby/dist/utils/development/segment"
import { SegmentEvent } from "../modules/segment"

export type IndexPageState = {
  updating: Record<string, boolean>
}

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
  const events = useEventSorter(all)
  const [ff] = useFeatureFlagContext()
  const loading = accountState.loading || state.loading
  const searching = !!params.get("search")
  const typeFilter = getEventType(params.get("type"))
  const [address, actions] = useAuthContext()

  const filteredEvents = useListEventsFiltered(events, {
    search: params.get("search"),
    type: typeFilter,
  })

  const eventsByMonth = useListEventsByMonth(filteredEvents)
  const trendingEvents = useListEventsTrending(filteredEvents)
  const mainEvents = useListEventsMain(events)

  // Items to be used in the toggle
  const toggleItems = useMemo(
    () => [
      {
        title: "All events",
        description: "Every event in Decentraland",
        active: typeFilter === ToggleItemsValue.All,
        value: ToggleItemsValue.All,
      },
      {
        title: "One time event",
        description: "Events which happen once",
        active: typeFilter === ToggleItemsValue.One,
        value: ToggleItemsValue.One,
      },
      {
        title: "Recurring event",
        description: "Events which happen on more than one day",
        active: typeFilter === ToggleItemsValue.Recurrent,
        value: ToggleItemsValue.Recurrent,
      },
    ],
    [typeFilter]
  )

  const handleTypeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const newParams = new URLSearchParams(params)

      // TODO: add value into ToggleBoxItem type in ToggleBox component (decentraland-ui)
      newParams.set("type", (item as any).value)

      track((analytics) =>
        analytics.track(SegmentEvent.Filter, {
          ethAddress: address,
          featureFlag: ff.flags,
          type: (item as any).value,
        })
      )

      let target = location.pathname
      const searchParams = newParams.toString()

      if (searchParams) {
        target += "?" + searchParams
      }

      navigate(target)
    },
    [location.pathname, params]
  )

  const [enabledNotification, setEnabledNotification] = useState(false)
  const handleEventClick = useCallback(
    (e: React.MouseEvent<any>, event: SessionEventAttributes) => {
      e.stopPropagation()
      e.preventDefault()
      navigate(locations.event(event.id))
    },
    []
  )

  const cardItemsPerRow = useMemo(
    () => ff.flags && Object.values(ff.flags).find((flag) => flag) ? 2 : 3,
    [ff.flags]
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

        {!loading && events.length > 0 && filteredEvents.length === 0 && (
          <div>
            <Divider />
            <Paragraph secondary style={{ textAlign: "center" }}>
              {l("page.events.not_found")}
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
              <EventCardMini loading={true} />
              <EventCardMini loading={true} />
              <EventCardMini loading={true} />
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
          <>
            <div className="GroupTitle">
              <SubTitle>
                {Time.from(Date.now(), {
                  utc: !settings?.use_local_time,
                }).format("MMMM")}
              </SubTitle>
            </div>
            <Card.Group>
              <EventCard loading={true} />
              <EventCard loading={true} />
              <EventCard loading={true} />
              <EventCard loading={true} />
              <EventCard loading={true} />
              <EventCard loading={true} />
            </Card.Group>
          </>
        )}

        {!loading && (
          <Row>
            {ff.flags && Object.values(ff.flags).find((flag) => flag) && 
              <Column align="left" className="sidebar">
                {ff.flags[FeatureFlags.FilterType] && 
                  <ToggleBox
                    header="Type"
                    onClick={handleTypeChange}
                    items={toggleItems}
                  />
                }
              </Column>
            }
            <Column align="right" grow={true}>
              {eventsByMonth.length > 0 &&
                eventsByMonth.map(([date, events]) => (
                  <Fragment key={"month:" + date.toJSON()}>
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
                  </Fragment>
                ))}
            </Column>
          </Row>
        )}
      </Container>
    </>
  )
}
