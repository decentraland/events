import React, { useMemo, useState } from "react"
import Helmet from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"

import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
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
import locations from "../modules/locations"
import "./index.css"

export default function MyEventsPage(props: any) {
  const l = useFormatMessage()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [account, accountState] = useAuthContext()
  const [eventList, eventsState] = useEventsContext()
  const events = useEventSorter(eventList)
  const [event] = useEventIdContext(params.get("event"))
  const pendingEvents = useMemo(
    () => events.filter((event) => !event.approved && !event.rejected),
    [events]
  )
  const [enabledNotification, setEnabledNotification] = useState(false)

  if (accountState.loading || !account) {
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
        onClose={prevent(() => navigate(locations.pendingEvents()))}
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
              <SubTitle>PENDING EVENTS</SubTitle>
            </div>
            {pendingEvents.length === 0 && (
              <div style={{ textAlign: "center" }}>
                <Divider size="tiny" />
                <Paragraph secondary>
                  You don't have any pending events, try to propose a{" "}
                  <Link
                    href={locations.submit()}
                    onClick={prevent(() => navigate(locations.submit()))}
                  >
                    new event
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
