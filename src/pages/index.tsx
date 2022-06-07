import React, { useMemo, useState } from "react"
import Helmet from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"

import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import EventModal from "../components/Event/EventModal/EventModal"
import { CarouselEvents } from "../components/Event/CarouselEvents/CarouselEvents"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import { TrendingEvents } from "../components/Event/TrendingEvents/TrendingEvents"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"

import {
  useEventIdContext,
  useEventSorter,
  useEventsContext,
} from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { ListEvents } from "../components/Event/ListEvents/ListEvents"
import locations, { toEventFilters } from "../modules/locations"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import { getSchedules } from "../modules/events"
import { getCurrentSchedules } from "../entities/Schedule/utils"
import "./index.css"
import { NoEvents } from "../components/Event/NoEvents/NoEvents"
import { SessionEventAttributes } from "../entities/Event/types"

export type IndexPageState = {
  updating: Record<string, boolean>
}

const empty: SessionEventAttributes[] = []

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

  const currentSchedule = useMemo(
    () => getCurrentSchedules(schedules),
    [schedules]
  )

  const filters = useMemo(() => toEventFilters(params), [params])
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

      <CarouselEvents
        events={filters.search ? empty : events}
        schedule={currentSchedule}
        loading={loading}
      />

      <Container>
        {!loading && events.length === 0 && <NoEvents />}

        {!filters.search && (
          <TrendingEvents events={events} loading={loading} />
        )}
        <ListEvents loading={loading} events={events} filters={filters} />
      </Container>
    </>
  )
}
