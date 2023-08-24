import React, { useMemo, useState } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"

import EditButtons from "../components/Button/EditButtons"
import EventDetail from "../components/Event/EventModal/EventDetail/EventDetail"
import EventStatusBanner from "../components/Event/EventModal/EventStatusBanner/EventStatusBanner"
import EventSection from "../components/Event/EventSection"
import ItemLayout from "../components/Layout/ItemLayout"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import { useEventIdContext } from "../context/Event"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import {
  canApproveAnyEvent,
  canApproveOwnEvent,
} from "../entities/ProfileSettings/utils"

import "./index.css"

export type EventPageState = {
  updating: Record<string, boolean>
}

export default function EventPage() {
  const l = useFormatMessage()
  const [, accountState] = useAuthContext()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [event, eventState] = useEventIdContext(params.get("id"))
  const [settings] = useProfileSettingsContext()

  const [enabledNotification, setEnabledNotification] = useState(false)
  const canApproveThisEvent = useMemo(
    () =>
      canApproveAnyEvent(settings) ||
      (event && event.user === settings.user && canApproveOwnEvent(settings)),
    [settings, event]
  )
  const loading = accountState.loading || eventState.loading

  if (!loading && !event && eventState.version !== 0) {
    return (
      <Container style={{ paddingTop: "75px" }}>
        <ItemLayout full>
          <NotFound />
        </ItemLayout>
      </Container>
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
      <Container style={{ paddingTop: "75px" }}>
        <ItemLayout>
          {eventState.loading && (
            <Loader active size="massive" style={{ position: "relative" }} />
          )}
          {!eventState.loading && event && (
            <>
              <ImgFixed src={event.image || ""} dimension="wide" />
              <EventStatusBanner event={event!} />
              <EventDetail event={event} />

              {(event.approved || canApproveThisEvent) && (
                <EventSection.Divider />
              )}

              {!event.approved && canApproveThisEvent && (
                <EventSection>
                  <EditButtons event={event!} />
                </EventSection>
              )}
            </>
          )}
        </ItemLayout>
      </Container>
    </>
  )
}
