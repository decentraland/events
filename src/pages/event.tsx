import React, { useState } from "react"
import Helmet from "react-helmet"
import { useLocation } from "@gatsbyjs/reach-router"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import { useEventIdContext } from "../context/Event"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import ItemLayout from "../components/Layout/ItemLayout"
import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import EventDetail from "../components/Event/EventModal/EventDetail/EventDetail"
import EventSection from "../components/Event/EventSection"
import AttendingButtons from "../components/Button/AttendingButtons"
import EditButtons from "../components/Button/EditButtons"
import EventStatusBanner from "../components/Event/EventModal/EventStatusBanner/EventStatusBanner"
import "./index.css"

export type EventPageState = {
  updating: Record<string, boolean>
}

export default function EventPage(props: any) {
  const l = useFormatMessage()
  // const [, accountState] = useAuthContext()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [event] = useEventIdContext(params.get("id"))

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
      <Container style={{ paddingTop: "75px" }}>
        <ItemLayout>
          {!event && (
            <Loader active size="massive" style={{ position: "relative" }} />
          )}
          {event && (
            <>
              <ImgFixed src={event.image || ""} dimension="wide" />
              <EventStatusBanner event={event!} />
              <EventDetail event={event} />

              {(event.approved || event.editable) && <EventSection.Divider />}
              {event.approved && (
                <EventSection>
                  <AttendingButtons event={event} />
                </EventSection>
              )}

              {!event.approved && event.editable && (
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
