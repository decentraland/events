import React, { useMemo, useState } from "react"
import Helmet from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"

import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import EventModal from "../components/Event/EventModal/EventModal"
import { CarouselEvents } from "../components/Layout/CarouselEvents/CarouselEvents"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import { TrendingEvents } from "../components/Layout/TrendingEvents/TrendingEvents"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"

import {
  useEventIdContext,
  useEventSorter,
  useEventsContext,
} from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { getEventTime, getEventType } from "../entities/Event/utils"
import useListEventsFiltered from "../hooks/useListEventsFiltered"
import useListEventsMain from "../hooks/useListEventsMain"
import useListEventsTrending from "../hooks/useListEventsTrending"
import { ListEvents } from "../components/Layout/ListEvents/ListEvents"
import locations from "../modules/locations"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import { getSchedules } from "../modules/events"
import { getCurrentSchedules } from "../entities/Schedule/utils"
import "./index.css"

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage() {
  const l = useFormatMessage()
  const [, accountState] = useAuthContext()
  const location = useLocation()
  const [schedules] = useAsyncMemo(getSchedules)
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const [event] = useEventIdContext(params.get("event"))
  const [settings] = useProfileSettingsContext()
  const [all, state] = useEventsContext()
  const events = useEventSorter(all, settings)
  const loading = accountState.loading || state.loading
  const searching = !!params.get("search")
  const typeFilter = getEventType(params.get("type"))

  const currentSchedule = useMemo(
    () => getCurrentSchedules(schedules),
    [schedules]
  )

  const timeFilter = getEventTime(
    params.get("time-from"),
    params.get("time-to")
  )

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

  const trendingEvents = useListEventsTrending(filteredEvents)
  const mainEvents = useListEventsMain(filteredEvents)

  const [enabledNotification, setEnabledNotification] = useState(false)

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

      {!searching && (
        <CarouselEvents
          events={mainEvents}
          schedule={currentSchedule}
          loading={loading}
        />
      )}

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
        <TrendingEvents
          events={trendingEvents}
          loading={loading}
          hasEvents={events.length > 0}
        />
        <ListEvents
          loading={loading}
          hasEvents={events.length > 0}
          events={filteredEvents}
          params={params}
        />
      </Container>
    </>
  )
}
