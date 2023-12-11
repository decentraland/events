import React, { useEffect, useMemo, useState } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import MaintenancePage from "decentraland-gatsby/dist/components/Layout/MaintenancePage"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"

import EventCard from "../components/Event/EventCard/EventCard"
import EventModal from "../components/Event/EventModal/EventModal"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import {
  useEventIdContext,
  useEventSorter,
  useEventsContext,
} from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { Flags } from "../modules/features"
import locations from "../modules/locations"

import "./index.css"

export default function MyEventsPage() {
  const l = useFormatMessage()
  const location = useLocation()
  const [ff] = useFeatureFlagContext()
  const params = new URLSearchParams(location.search)
  const [account, accountState] = useAuthContext()
  const [eventList, eventsState] = useEventsContext()
  const [settings] = useProfileSettingsContext()
  const events = useEventSorter(eventList, settings)
  const [event] = useEventIdContext(params.get("event"))
  const pendingEvents = useMemo(
    () => events.filter((event) => !event.approved && !event.rejected),
    [events]
  )
  const [enabledNotification, setEnabledNotification] = useState(false)
  // redirect old urls to the new ones
  useEffect(() => {
    if (event) {
      navigate(locations.event(event.id), { replace: true })
    }
  }, [event])

  if (ff.flags[Flags.Maintenance]) {
    return <MaintenancePage />
  }

  if (accountState.loading || !account) {
    return (
      <>
        <Helmet>
          <title>{l("social.home.title") || ""}</title>
          <meta
            name="description"
            content={l("social.home.description") || ""}
          />

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
          <meta
            name="twitter:card"
            content={
              event ? "summary_large_image" : l("social.home.card") || ""
            }
          />
          <meta
            name="twitter:creator"
            content={l("social.home.creator") || ""}
          />
          <meta name="twitter:site" content={l("social.home.site") || ""} />
        </Helmet>
        <Navigation />
        <Container>
          <SignIn
            isConnecting={accountState.loading}
            onConnect={() => accountState.select()}
          />
        </Container>
      </>
    )
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
      <Navigation activeTab={NavigationTab.PendingEvents} />
      <Container>
        {eventsState.loading && (
          <div>
            <Divider />
            <Loader active size="massive" style={{ position: "relative" }} />
            <Divider />
          </div>
        )}
        {!eventsState.loading && account && (
          <div>
            <div className="GroupTitle">
              <SubTitle>{l("page.pending.pending_events")}</SubTitle>
            </div>
            {pendingEvents.length === 0 && (
              <div style={{ textAlign: "center" }}>
                <Divider size="tiny" />
                <Paragraph secondary>
                  {l("page.pending.you_dont_have_any_pending")}{" "}
                  <Link
                    href={locations.submitEvent()}
                    onClick={prevent(() => navigate(locations.submitEvent()))}
                  >
                    {l("page.pending.new_event")}
                  </Link>
                  .
                </Paragraph>
                <Divider size="tiny" />
              </div>
            )}
            {pendingEvents.length > 0 && (
              <Card.Group>
                {pendingEvents.map((event) => (
                  <EventCard
                    key={"event:" + event.id}
                    event={event}
                    onClick={prevent(() => navigate(locations.event(event.id)))}
                  />
                ))}
              </Card.Group>
            )}
          </div>
        )}
      </Container>
    </>
  )
}
