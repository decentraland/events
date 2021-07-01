
import React, { useMemo, useState, Fragment } from "react"
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

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage(props: any) {
  const now = Date.now()
  const [ , accountState ] = useAuthContext()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [ event ] = useEventIdContext(params.get('event'))
  const [ settings ] = useProfileSettingsContext()
  const [ all, state ] = useEventsContext()
  const events = useEventSorter(all)
  const loading = accountState.loading || state.loading

  const eventsByMonth = useListEventsByMonth(events)
  const trendingEvents = useMemo(() => events.filter((event) => !!event.trending), [events])
  const mainEvents = useMemo(
    () => events
      .filter((event) => event.approved && event.highlighted && event.finish_at.getTime() > now)
      .sort((eventA, eventB) => {
        return Math.abs(now - eventA.next_start_at.getTime()) - Math.abs(now - eventB.next_start_at.getTime())
      }),
    [events]
  )

  const [enabledNotification, setEnabledNotification] = useState(false)

  return (<>
      <EnabledNotificationModal open={enabledNotification} onClose={() => setEnabledNotification(false)} />
      <EventModal event={event} onClose={prevent(() => navigate(locations.events()))} />
      <Navigation activeTab={NavigationTab.Events} />
      <Container>

        {loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}

        {!loading && events.length === 0 && <div>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </div>}

        {!loading && events.length > 0 && mainEvents.length > 0 && <div>
          <Carousel>
            {mainEvents.map(event => <EventCardBig
              key={'live:' + event.id}
              event={event}
              onClick={prevent(() => navigate(locations.event(event.id)))}
            />)}
        </Carousel>
        </div>}

        {!loading && events.length > 0 && trendingEvents.length > 0 && <div>
          <div className="GroupTitle"><SubTitle>TRENDING</SubTitle></div>
          <Card.Group>
            {trendingEvents.map(event => <EventCardMini
              key={'trending:' + event.id}
              event={event}
              onClick={prevent(() => navigate(locations.event(event.id)))}
            />)}
          </Card.Group></div>}

        {!loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <Fragment key={'month:' + date.toJSON()}>
          <div className="GroupTitle">
            <SubTitle>{Time.from(date, { utc: !settings?.use_local_time }).format('MMMM')}</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => <EventCard
              key={'event:' + event.id}
              event={event}
              onClick={prevent(() => navigate(locations.event(event.id)))}
            />)}
          </Card.Group>
        </Fragment>)}
      </Container>
    </>)
}
