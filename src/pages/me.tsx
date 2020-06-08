
import React, { useMemo, useEffect, useState, Fragment } from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import Layout from "../components/Layout/Layout"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import useListEvents from '../hooks/useListEvents'
import { SessionEventAttributes } from "../entities/Event/types"
import WalletRequiredModal from "../components/WalletRequiredModal/WalletRequiredModal"
import SEO from "../components/seo"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../utils/segment'
import useAnalytics from "../hooks/useAnalytics"

import './index.css'
import SubmitButton from "../components/Button/SubmitButton"
import Link from "decentraland-gatsby/dist/components/Text/Link"

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage(props: any) {
  const [state, patchState] = usePatchState<IndexPageState>({ updating: {} })
  const location = useLocation()
  const eventId = url.getEventId(location)
  const isListingAttendees = url.isEventAttendees(location)
  const siteStore = useSiteStore(props.location)
  const events = useListEvents(siteStore.events.getState().data)
  const myEvents = useMemo(() => events.filter((event) => event.owned), [siteStore.events.getState()])
  const attendingEvents = useMemo(() => events.filter((event) => !!event.attending), [siteStore.events.getState()])
  const currentEvent = eventId && siteStore.events.getEntity(eventId) || null

  const [requireWallet, setRequireWallet] = useState(false)
  useEffect(() => {
    if (siteStore.connectError === 'CONNECT_ERROR') {
      setRequireWallet(true)
    }
  }, [siteStore.connectError])

  const title = currentEvent && currentEvent.name || "Decentraland Events"
  const path = url.toUrl(location.pathname, location.search)

  useAnalytics((analytics) => {
    const name = currentEvent ? segment.Page.Event : segment.Page.Home
    analytics.page(name, { title, path })
  }, [path])

  function handleSubmit(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(url.toSubmit(location), siteStore.getNavigationState())
  }

  function handleHome(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(url.toHome(location), siteStore.getNavigationState())
  }

  function handleCloseModal(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(url.toMyEvents(location), siteStore.getNavigationState())
  }

  function handleOpenModal(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEvent(location, data.id, true), siteStore.getNavigationState())
  }

  function handleOpenEdit(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEventEdit(location, data.id), siteStore.getNavigationState())
  }

  function handleOpenAttendees(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEventAttendees(location, data.id, true), siteStore.getNavigationState())
  }

  function handleChangeEvent(e: React.MouseEvent<any>, data: SessionEventAttributes) {
    e.preventDefault()
    const event = siteStore.events.getEntity(data.id)

    if (!event || state.updating[event.id]) {
      return
    }

    patchState({ updating: { ...state.updating, [event.id]: true } })

    Promise.resolve()
      .then(async () => {
        if (event.attending !== data.attending) {
          await siteStore.attendEvent(event.id, data.attending)
        }
      })
      .then(async () => {
        const { approved, rejected } = data
        if (
          event.editable &&
          (
            event.approved !== approved ||
            event.rejected !== rejected
          )
        ) {
          await siteStore.updateEvent(event.id, { approved, rejected })
        }
      })
      .then(() => patchState({ updating: { ...state.updating, [event.id]: false } }))
      .catch(err => patchState({ updating: { ...state.updating, [event.id]: false } }))
  }

  return (
    <Layout {...props}>
      <SEO title={title} />
      <WalletRequiredModal open={requireWallet} onClose={() => setRequireWallet(false)} />
      <EventModal
        event={currentEvent}
        attendees={isListingAttendees}
        updating={!!(currentEvent && state.updating[currentEvent.id])}
        onClose={handleCloseModal}
        onClickEdit={handleOpenEdit}
        onClickAttendees={handleOpenAttendees}
        onChangeEvent={handleChangeEvent}
      />
      <div style={{ paddingTop: "75px" }} />
      <Tabs>
        <Tabs.Tab onClick={handleHome}>World Events</Tabs.Tab>
        <Tabs.Tab active>My Events</Tabs.Tab>
        <SubmitButton onClick={handleSubmit} />
      </Tabs>
      <Container>
        {siteStore.loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}
        {!siteStore.loading && !siteStore.profile && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>You need to <Link onClick={() => siteStore.connect()}>sign in</Link> before to submit an event</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && siteStore.profile && events.length === 0 && <div>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && siteStore.profile && events.length > 0 && <div>
          <div className="GroupTitle"><SubTitle>GOING</SubTitle></div>
          {attendingEvents.length === 0 && <div style={{ textAlign: 'center' }}>
            <Divider size="mini" />
            <Paragraph secondary>You are not attending to any event, find some <Link href={url.toHome(location)} onClick={handleHome}>amazing event</Link>.</Paragraph>
            <Divider size="mini" />
          </div>}
          {attendingEvents.length > 0 && <Card.Group>
            {attendingEvents.map(event => <EventCardMini key={'going:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenModal} />)}
          </Card.Group>}
        </div>}
        {!siteStore.loading && siteStore.profile && events.length > 0 && <div>
          <div className="GroupTitle"><SubTitle>HOSTED BY ME</SubTitle></div>
          {myEvents.length === 0 && <div style={{ textAlign: 'center' }}>
            <Divider size="tiny" />
            <Paragraph secondary>You are not hosting any events, try to propose a <Link href={url.toSubmit(location)} onClick={handleSubmit}>new event</Link>.</Paragraph>
            <Divider size="tiny" />
          </div>}
          {myEvents.length > 0 && <Card.Group>
            {myEvents.map((event) => <EventCard
              key={'event:' + event.id}
              event={event}
              updating={state.updating[event.id]}
              href={url.toEvent(location, event.id)}
              onChangeEvent={handleChangeEvent}
              onClick={handleOpenModal}
            />)}
          </Card.Group>}
        </div>}
      </Container>
    </Layout>
  )
}
