
import React, { useMemo, useState } from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"

import Link from "decentraland-gatsby/dist/components/Text/Link"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import locations from "../modules/locations"
import { useEventIdContext, useEventsContext, useEventSorter } from "../context/Event"
import './index.css'
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"

export default function MyEventsPage(props: any) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [ account, accountState ] = useAuthContext()
  const [ eventList, eventsState ] = useEventsContext()
  const events = useEventSorter(eventList)
  const [ event ] = useEventIdContext(params.get('event'))
  const pendingEvents = useMemo(() => events.filter((event) => !event.approved && !event.rejected), [ events ])
  const [enabledNotification, setEnabledNotification] = useState(false)

  if (accountState.loading || !account) {
    return <>
      <Navigation />
      <Container>
        <SignIn isConnecting={accountState.loading}  onConnect={() => accountState.select()} />
      </Container>
    </>
  }

  return (
    <>
      <EnabledNotificationModal open={enabledNotification} onClose={() => setEnabledNotification(false)} />
      <EventModal event={event} onClose={prevent(() => navigate(locations.pendingEvents()))} />
      <Navigation activeTab={NavigationTab.PendingEvents} />
      <Container>
        {eventsState.loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}
        {!eventsState.loading && account && <div>
          <div className="GroupTitle"><SubTitle>PENDING EVENTS</SubTitle></div>
          {pendingEvents.length === 0 && <div style={{ textAlign: 'center' }}>
            <Divider size="tiny" />
            <Paragraph secondary>You don't have any pending events, try to propose a <Link href={locations.submit()} onClick={prevent(() => navigate(locations.submit()))}>new event</Link>.</Paragraph>
            <Divider size="tiny" />
          </div>}
          {pendingEvents.length > 0 && <Card.Group>
            {pendingEvents.map((event) => <EventCard
              key={'event:' + event.id}
              event={event}
              onClick={prevent(() => navigate(locations.pendingEvent(event.id)))}
            />)}
          </Card.Group>}
        </div>}
      </Container>
    </>
  )
}
