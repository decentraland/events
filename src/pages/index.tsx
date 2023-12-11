import React, { useEffect, useMemo, useState } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import MaintenancePage from "decentraland-gatsby/dist/components/Layout/MaintenancePage"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { CarouselEvents } from "../components/Event/CarouselEvents/CarouselEvents"
import { ListEvents } from "../components/Event/ListEvents/ListEvents"
import { NoEvents } from "../components/Event/NoEvents/NoEvents"
import { TrendingEvents } from "../components/Event/TrendingEvents/TrendingEvents"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import {
  useEventIdContext,
  useEventSorter,
  useEventsContext,
} from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { SessionEventAttributes } from "../entities/Event/types"
import { getCurrentSchedules } from "../entities/Schedule/utils"
import { getSchedules } from "../modules/events"
import { Flags } from "../modules/features"
import locations, { toEventFilters } from "../modules/locations"

import "./index.css"

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

  // redirect old urls to the new ones
  useEffect(() => {
    if (event) {
      navigate(locations.event(event.id), { replace: true })
    }
  }, [event])

  const [ff] = useFeatureFlagContext()

  if (ff.flags[Flags.Maintenance]) {
    return <MaintenancePage />
  }

  return (
    <>
      <Helmet>
        <title>{l("social.home.title") || ""}</title>
        <meta name="description" content={l("social.home.description") || ""} />

        <meta property="og:title" content={l("social.home.title") || ""} />
        <meta
          property="og:description"
          content={l("social.home.description") || ""}
        />
        <meta property="og:image" content={l("social.home.image") || ""} />
        <meta property="og:site" content={l("social.home.site") || ""} />

        <meta name="twitter:title" content={l("social.home.title") || ""} />
        <meta
          name="twitter:description"
          content={l("social.home.description") || ""}
        />
        <meta name="twitter:image" content={l("social.home.image") || ""} />
        <meta name="twitter:card" content={l("social.home.card") || ""} />
        <meta name="twitter:creator" content={l("social.home.creator") || ""} />
        <meta name="twitter:site" content={l("social.home.site") || ""} />
      </Helmet>
      <EnabledNotificationModal
        open={enabledNotification}
        onClose={() => setEnabledNotification(false)}
      />

      <Navigation activeTab={NavigationTab.Events} search />

      <CarouselEvents
        events={filters.search ? empty : events}
        schedule={currentSchedule}
        loading={loading}
      />

      <TrendingEvents
        events={filters.search ? empty : events}
        loading={loading}
      />

      <Container>
        {!loading && events.length === 0 && <NoEvents />}
        <ListEvents loading={loading} events={events} filters={filters} />
      </Container>
    </>
  )
}
