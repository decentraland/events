import React, { useEffect, useMemo, useState } from "react"

import { Helmet } from "react-helmet"

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
import EventCard from "events-component/src/Event/EventCard/EventCard"
import EventCardMini from "events-component/src/Event/EventCardMini/EventCardMini"
import Navigation, {
  NavigationTab,
} from "events-component/src/Layout/Navigation"
import EnabledNotificationModal from "events-component/src/Modal/EnabledNotificationModal"

import {
  useEventIdContext,
  useEventSorter,
  useEventsContext,
} from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import useListEventsFiltered from "../hooks/useListEventsFiltered"
import locations from "../modules/locations"

import "./index.css"

export default function MyEventsPage() {
  const l = useFormatMessage()
  const location = useLocation()
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )

  const [account, accountState] = useAuthContext()
  const [eventList, eventsState] = useEventsContext()
  const [settings] = useProfileSettingsContext()
  const events = useEventSorter(eventList, settings)
  const [event] = useEventIdContext(params.get("event"))
  const filteredEvents = useListEventsFiltered(
    events,
    {
      search: params.get("search"),
    },
    settings
  )
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

  // redirect old urls to the new ones
  useEffect(() => {
    if (event) {
      navigate(locations.event(event.id), { replace: true })
    }
  }, [event])

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
      <Navigation activeTab={NavigationTab.MyEvents} search />
      <Container>
        {!loading && !account && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>
              {l("sign_in.message", {
                action: (
                  <Link onClick={() => null}>{l("general.sign_in")}</Link>
                ),
              })}
            </Paragraph>
            <Divider />
          </div>
        )}
        {account && (
          <div>
            <div className="GroupTitle">
              <SubTitle>{l("page.me.going")}</SubTitle>
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
                    {l("page.me.you_are_not_attending")}{" "}
                    <Link
                      href={locations.events()}
                      onClick={prevent(() => navigate(locations.events()))}
                    >
                      {l("page.me.amazing_event")}
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
              <SubTitle>{l("page.me.hosted_by_me")}</SubTitle>
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
                    {l("page.me.you_are_not_hosting")}{" "}
                    <Link
                      href={locations.submitEvent()}
                      onClick={prevent(() => navigate(locations.submitEvent()))}
                    >
                      {l("page.me.new_event")}
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
