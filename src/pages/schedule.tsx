import React, { useMemo, useState } from "react"
import Helmet from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"

import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { ListEvents } from "../components/Layout/ListEvents/ListEvents"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import { useEventSchedule, useEventsContext } from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { getEventTime, getEventType } from "../entities/Event/utils"
import useListEventsFiltered from "../hooks/useListEventsFiltered"
import { getSchedules } from "../modules/events"
import "./index.css"

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

  const [schedules] = useAsyncMemo(getSchedules)

  const schedule = useMemo(
    () => schedules?.find((schedule) => schedule.id === params.get("id")),
    [schedules, params.get("id")]
  )

  const [settings] = useProfileSettingsContext()

  const [all, state] = useEventsContext()
  const events = useEventSchedule(all, params.get("id"))

  const loading = accountState.loading || state.loading
  const typeFilter = getEventType(params.get("type"))

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

  const [enabledNotification, setEnabledNotification] = useState(false)

  return (
    <>
      <Helmet>
        <title>{schedule?.name || l("social.home.title") || ""}</title>
        <meta
          name="description"
          content={schedule?.description || l("social.home.description") || ""}
        />

        <meta
          property="og:title"
          content={schedule?.name || l("social.home.title") || ""}
        />
        <meta
          property="og:description"
          content={schedule?.description || l("social.home.description") || ""}
        />
        <meta
          property="og:image"
          content={schedule?.image || l("social.home.image") || ""}
        />
        <meta property="og:site" content={l("social.home.site") || ""} />

        <meta
          name="twitter:title"
          content={schedule?.name || l("social.home.title") || ""}
        />
        <meta
          name="twitter:description"
          content={schedule?.description || l("social.home.description") || ""}
        />
        <meta
          name="twitter:image"
          content={schedule?.image || l("social.home.image") || ""}
        />
        <meta name="twitter:card" content={l("social.home.card") || ""} />
        <meta name="twitter:creator" content={l("social.home.creator") || ""} />
        <meta name="twitter:site" content={l("social.home.site") || ""} />
      </Helmet>
      <EnabledNotificationModal
        open={enabledNotification}
        onClose={() => setEnabledNotification(false)}
      />
      <Navigation activeTab={schedule && NavigationTab.Schedule} search />

      <Container>
        {!loading && !schedule && <NotFound />}
        {!loading && events.length === 0 && (
          <div>
            <Divider />
            <Paragraph secondary style={{ textAlign: "center" }}>
              {l("page.events.no_events")}
            </Paragraph>
            <Divider />
          </div>
        )}
        {!loading && schedule && (
          <SubTitle className="events__all-events-title">
            {schedule?.name}
          </SubTitle>
        )}

        <ListEvents
          hideFilter={true}
          loading={loading}
          hasEvents={events.length > 0}
          events={filteredEvents}
          params={params}
        />
      </Container>
    </>
  )
}
