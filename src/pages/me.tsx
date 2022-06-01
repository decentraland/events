import React, { useMemo, useState } from "react"
import Helmet from "react-helmet"
import { useLocation } from "@gatsbyjs/reach-router"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"

import Link from "decentraland-gatsby/dist/components/Text/Link"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import locations from "../modules/locations"
import {
  useEventIdContext,
  useEventsContext,
  useEventSorter,
} from "../context/Event"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import "./index.css"
import useListEventsFiltered from "../hooks/useListEventsFiltered"

export default function MyEventsPage() {
  const l = useFormatMessage()
  const location = useLocation()
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  // const events = useListEvents(siteStore.events.getState().data)
  const [account, accountState] = useAuthContext()
  const [eventList, eventsState] = useEventsContext()
  const events = useEventSorter(eventList)
  const [event] = useEventIdContext(params.get("event"))
  const filteredEvents = useListEventsFiltered(events, {
    search: params.get("search"),
  })
  const myEvents = useMemo(
    () => filteredEvents.filter((event) => event.user === account),
    [filteredEvents, account]
  )
  const attendingEvents = useMemo(
    () => filteredEvents.filter((event) => !!event.attending),
    [filteredEvents]
  )
  const [enabledNotification, setEnabledNotification] = useState(false)
  const loading = accountState.loading || eventsState.loading
  const searching = !!params.get("search")

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
        onClose={prevent(() => navigate(locations.myEvents()))}
      />
      <Navigation activeTab={NavigationTab.MyEvents} search />
      <Container>
        {!loading && !account && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>
              You need to <Link onClick={() => null}>sign in</Link> before to
              submit an event
            </Paragraph>
            <Divider />
          </div>
        )}
        {account && (
          <div>
            <div className="GroupTitle">
              <SubTitle>GOING</SubTitle>
            </div>
            {loading && (
              <Card.Group>
                <EventCardMini loading={true} />
                <EventCardMini loading={true} />
                <EventCardMini loading={true} />
              </Card.Group>
            )}
            {!loading && attendingEvents.length === 0 && (
              <div style={{ textAlign: "center" }}>
                <Divider size="mini" />
                {!searching && (
                  <Paragraph secondary>
                    You are not attending to any event, find some{" "}
                    <Link
                      href={locations.events()}
                      onClick={prevent(() => navigate(locations.events()))}
                    >
                      amazing event
                    </Link>
                    .
                  </Paragraph>
                )}
                {searching && (
                  <Paragraph secondary>{l("page.events.not_found")}</Paragraph>
                )}
                <Divider size="mini" />
              </div>
            )}
            {!loading && attendingEvents.length > 0 && (
              <Card.Group>
                {attendingEvents.map((event) => (
                  <EventCardMini
                    key={"going:" + event.id}
                    event={event}
                    onClick={prevent(() => navigate(locations.event(event.id)))}
                  />
                ))}
              </Card.Group>
            )}
          </div>
        )}
        {account && (
          <div>
            <div className="GroupTitle">
              <SubTitle>HOSTED BY ME</SubTitle>
            </div>
            {loading && (
              <Card.Group>
                <EventCard loading={true} />
                <EventCard loading={true} />
                <EventCard loading={true} />
              </Card.Group>
            )}
            {!loading && myEvents.length === 0 && (
              <div style={{ textAlign: "center" }}>
                <Divider size="tiny" />
                {!searching && (
                  <Paragraph secondary>
                    You are not hosting any events, try to propose a{" "}
                    <Link
                      href={locations.submit()}
                      onClick={prevent(() => navigate(locations.submit()))}
                    >
                      new event
                    </Link>
                    .
                  </Paragraph>
                )}

                {searching && (
                  <Paragraph secondary>{l("page.events.not_found")}</Paragraph>
                )}
                <Divider size="tiny" />
              </div>
            )}
            {!loading && myEvents.length > 0 && (
              <Card.Group>
                {myEvents.map((event) => (
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
