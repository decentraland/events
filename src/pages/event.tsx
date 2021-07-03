
import React, { useMemo, useState, Fragment } from "react"
import Helmet from "react-helmet"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import Carousel from "decentraland-gatsby/dist/components/Carousel/Carousel"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import EventCardBig from "../components/Event/EventCardBig/EventCardBig"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"

import useListEventsByMonth from '../hooks/useListEventsByMonth'

import locations from "../modules/locations"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { useEventIdContext, useEventsContext, useEventSorter } from "../context/Event"
import './index.css'
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import ItemLayout from "../components/Layout/ItemLayout"
import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import EventDetail from "../components/Event/EventModal/EventDetail/EventDetail"
import EventSection from "../components/Event/EventSection"
import AttendingButtons from "../components/Button/AttendingButtons"
import EditButtons from "../components/Button/EditButtons"

export type EventPageState = {
  updating: Record<string, boolean>
}

export default function EventPage(props: any) {
  const l = useFormatMessage()
  // const [, accountState] = useAuthContext()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [event] = useEventIdContext(params.get('id'))
  // const [settings] = useProfileSettingsContext()
  // const [all, state] = useEventsContext()
  // const loading = accountState.loading || state.loading

  const [enabledNotification, setEnabledNotification] = useState(false)

  return (<>
    <Helmet>
      <title>{event?.name || l('social.home.title') || ''}</title>
      <meta name="description" content={event?.description || l('social.home.description') || ''} />

      <meta property="og:title" content={event?.name || l('social.home.title') || ''} />
      <meta property="og:description" content={event?.description || l('social.home.description') || ''} />
      <meta property="og:image" content={event?.image || l('social.home.image') || ''} />
      <meta property="og:site" content={l('social.home.site') || ''} />

      <meta name="twitter:title" content={event?.description || l('social.home.title') || ''} />
      <meta name="twitter:description" content={event?.description || l('social.home.description') || ''} />
      <meta name="twitter:image" content={event?.image || l('social.home.image') || ''} />
      <meta name="twitter:card" content={event ? 'summary_large_image' : l('social.home.card') || ''} />
      <meta name="twitter:creator" content={l('social.home.creator') || ''} />
      <meta name="twitter:site" content={l('social.home.site') || ''} />
    </Helmet>
    <EnabledNotificationModal open={enabledNotification} onClose={() => setEnabledNotification(false)} />
    <Container style={{ paddingTop: '75px' }}>
      <ItemLayout>
        {!event && <Loader active size="massive" style={{ position: 'relative' }} />}
        {event && <>
          <ImgFixed src={event.image || ''} dimension="wide" />
          <EventDetail event={event} />

          {(event.approved || event.editable) && <EventSection.Divider />}

          {event.approved && <EventSection>
            <AttendingButtons event={event} />
          </EventSection>}

          {!event.approved && event.editable && <EventSection>
            <EditButtons event={event!} />
          </EventSection>}
        </>}
      </ItemLayout>
    </Container>
  </>)
}
