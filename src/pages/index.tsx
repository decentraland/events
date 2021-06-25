
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
import useSiteStore from '../hooks/useSiteStore'

import locations from "../modules/locations"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { useEventIdContext, useEventsContext, useEventSorter } from "../context/Event"
import './index.css'

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage(props: any) {
  const now = Date.now()
  // const [state, patchState] = usePatchState<IndexPageState>({ updating: {} })
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [ event ] = useEventIdContext(params.get('event'))
  const [ settings ] = useProfileSettingsContext()
  const [ all ] = useEventsContext()
  const events = useEventSorter(all)
  const siteStore = useSiteStore(props.location)

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

  // function handleCloseModal(event: React.MouseEvent<any>) {
  //   event.preventDefault()
  //   event.stopPropagation()
  //   navigate(url.toHome(location), siteStore.getNavigationState())
  // }

  // function handleOpenEdit(event: React.MouseEvent<any>, data: SessionEventAttributes) {
  //   event.preventDefault()
  //   event.stopPropagation()
  //   navigate(url.toEventEdit(location, data.id), siteStore.getNavigationState())
  // }

  // function handleOpenEventDetail(event: React.MouseEvent<any>, data: SessionEventAttributes) {
  //   event.preventDefault()
  //   event.stopPropagation()
  //   navigate(url.toEvent(location, data.id), siteStore.getNavigationState())
  // }

  // function handleOpenAttendees(event: React.MouseEvent<any>, data: SessionEventAttributes) {
  //   event.preventDefault()
  //   event.stopPropagation()
  //   navigate(url.toEventAttendees(location, data.id), siteStore.getNavigationState())
  // }

  // function handleChangeEvent(e: React.MouseEvent<any>, data: SessionEventAttributes) {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   const event = siteStore.events.getEntity(data.id)

  //   if (!event || state.updating[event.id]) {
  //     return
  //   }

  //   patchState({ updating: { ...state.updating, [event.id]: true } })

  //   Promise.resolve()
  //     .then(async () => {
  //       if (event.attending !== data.attending) {
  //         await siteStore.attendEvent(event.id, data.attending)

  //       } else if (event.notify !== data.notify) {
  //         if (!siteStore.settings || (!siteStore.settings.notify_by_email && !siteStore.settings.notify_by_browser)) {
  //           setEnabledNotification(true)

  //         } else {
  //           await siteStore.notifyEvent(event.id, data.notify)
  //         }
  //       }
  //     })
  //     .then(async () => {
  //       const { approved, rejected } = data
  //       if (
  //         event.editable &&
  //         (
  //           event.approved !== approved ||
  //           event.rejected !== rejected
  //         )
  //       ) {
  //         await siteStore.updateEvent(event.id, { approved, rejected })
  //       }
  //     })
  //     .then(() => patchState({ updating: { ...state.updating, [event.id]: false } }))
  //     .catch(err => patchState({ updating: { ...state.updating, [event.id]: false } }))
  // }

  return (<>
      <EnabledNotificationModal open={enabledNotification} onClose={() => setEnabledNotification(false)} />
      <EventModal event={event} onClose={prevent(() => navigate(locations.events()))} />
      <Navigation activeTab={NavigationTab.Events} />
      <Container>

        {siteStore.loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}

        {!siteStore.loading && events.length === 0 && <div>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </div>}

        {!siteStore.loading && events.length > 0 && mainEvents.length > 0 && <div>
          <Carousel>
            {mainEvents.map(event => <EventCardBig
              key={'live:' + event.id}
              event={event}
              onClick={prevent(() => navigate(locations.event(event.id)))}
            />)}
        </Carousel>
        </div>}

        {!siteStore.loading && events.length > 0 && trendingEvents.length > 0 && <div>
          <div className="GroupTitle"><SubTitle>TRENDING</SubTitle></div>
          <Card.Group>
            {trendingEvents.map(event => <EventCardMini
              key={'trending:' + event.id}
              event={event}
              onClick={prevent(() => navigate(locations.event(event.id)))}
            />)}
          </Card.Group></div>}

        {!siteStore.loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <Fragment key={'month:' + date.toJSON()}>
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
