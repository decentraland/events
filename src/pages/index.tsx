
import React, { useMemo, useEffect, useState, Fragment } from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import Layout from "../components/Layout/Layout"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { toMonthName } from "decentraland-gatsby/dist/components/Date/utils"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import useListEvents from '../hooks/useListEvents'
import useListEventsByMonth from '../hooks/useListEventsByMonth'
import { EventAttributes, SessionEventAttributes } from "../entities/Event/types"
import WalletRequiredModal from "../components/WalletRequiredModal/WalletRequiredModal"
import SEO from "../components/seo"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../utils/segment'
import useAnalytics from "../hooks/useAnalytics"

import './index.css'
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"

const invertedAdd = require('../images/inverted-add.svg')

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage(props: any) {
  const [state, patchState] = usePatchState<IndexPageState>({ updating: {} })
  const [profile, profileActions] = useProfile()
  const location = useLocation()
  const eventId = url.getEventId(location)
  const isListingAttendees = url.isEventAttendees(location)
  const siteStore = useSiteStore(props.location)
  const events = useListEvents(siteStore.events.getState().data)
  const eventsByMonth = useListEventsByMonth(events)
  const myEvents = useMemo(() => events.filter((event: EventAttributes) => profile && event.user === profile.address.toString()), [siteStore.events.getState()])
  const attendingEvents = useMemo(() => events.filter((event: any) => !!event.attending), [siteStore.events.getState()])
  const currentEvent = eventId && siteStore.events.getEntity(eventId) || null

  const [requireWallet, setRequireWallet] = useState(false)
  useEffect(() => {
    if (Boolean(profileActions.error && profileActions.error.code === 'CONNECT_ERROR')) {
      setRequireWallet(true)
    }
  }, [profileActions.error, profileActions.error && profileActions.error.code])

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

  function handleCloseModal(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(url.toHome(location), siteStore.getNavigationState())
  }

  function handleOpenModal(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEvent(location, data.id), siteStore.getNavigationState())
  }

  function handleOpenEdit(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEventEdit(location, data.id), siteStore.getNavigationState())
  }

  function handleOpenAttendees(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEventAttendees(location, data.id), siteStore.getNavigationState())
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
          event.approved !== approved ||
          event.rejected !== rejected
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
      {currentEvent && <EventModal
        event={currentEvent}
        attendees={isListingAttendees}
        updating={state.updating[currentEvent.id]}
        onClose={handleCloseModal}
        onClickEdit={handleOpenEdit}
        onClickAttendees={handleOpenAttendees}
        onChangeEvent={handleChangeEvent}
      />}
      <div style={{ paddingTop: "75px" }} />
      <Tabs>
        <Tabs.Tab active>World Events</Tabs.Tab>
        {/* <Tabs.Tab>My Assets</Tabs.Tab> */}
        <Button basic size="small" onClick={handleSubmit}>
          <img src={invertedAdd} width="16" height="16" style={{ width: '16px', height: 'auto', verticalAlign: 'text-bottom', marginRight: '1rem' }} />
          SUBMIT EVENT
        </Button>
      </Tabs>
      <Container>
        {siteStore.loading && <>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </>}
        {!siteStore.loading && events.length === 0 && <>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </>}
        {!siteStore.loading && events.length > 0 && attendingEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>GOING</SubTitle></div>
          <Card.Group>
            {attendingEvents.map(event => <EventCardMini key={'going:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenModal} />)}
          </Card.Group></>}
        {!siteStore.loading && events.length > 0 && myEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>MY EVENTS</SubTitle></div>
          <Card.Group>
            {myEvents.map(event => <EventCardMini key={'my:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenModal} />)}
          </Card.Group></>}
        {!siteStore.loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <Fragment key={'month:' + date.toJSON()}>
          <div className="GroupTitle">
            <SubTitle>{toMonthName(date, { utc: true })}</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => <EventCard
              key={'event:' + event.id}
              updating={state.updating[event.id]}
              event={event}
              href={url.toEvent(location, event.id)}
              onChangeEvent={handleChangeEvent}
              onClick={handleOpenModal}
            />)}
          </Card.Group>
        </Fragment>)}
      </Container>
    </Layout>
  )
}
