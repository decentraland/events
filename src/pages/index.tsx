
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
import Events from "../api/Events"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../utils/segment'

import './index.css'
import useAnalytics from "../hooks/useAnalytics"

const invertedAdd = require('../images/inverted-add.svg')

export default function IndexPage(props: any) {
  const [profile, profileActions] = useProfile()
  const location = useLocation()
  const eventId = url.getEventId(location)
  const isListingAttendees = url.isEventAttendees(location)
  const siteStore = useSiteStore(props.location)
  const state = siteStore.events.getState()
  const events = useListEvents(state.data)
  const eventsByMonth = useListEventsByMonth(events)
  const myEvents = useMemo(() => events.filter((event: EventAttributes) => profile && event.user === profile.address.toString()), [state])
  const attendingEvents = useMemo(() => events.filter((event: any) => !!event.attending), [state])
  const currentEvent = eventId && state.data[eventId] || null
  const loading = profileActions.loading || state.loading

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

  function handleEdit(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEventEdit(location, data.id), siteStore.getNavigationState())
  }

  return (
    <Layout {...props}>
      <SEO title={title} />
      <WalletRequiredModal open={requireWallet} onClose={() => setRequireWallet(false)} />
      <EventModal event={currentEvent} attendees={isListingAttendees} onClose={handleCloseModal} onEdit={handleEdit} />
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
        {loading && <>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </>}
        {!loading && events.length === 0 && <>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </>}
        {!loading && events.length > 0 && attendingEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>GOING</SubTitle></div>
          <Card.Group>
            {attendingEvents.map(event => <EventCardMini key={'going:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenModal} />)}
          </Card.Group></>}
        {!loading && events.length > 0 && myEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>MY EVENTS</SubTitle></div>
          <Card.Group>
            {myEvents.map(event => <EventCardMini key={'my:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenModal} />)}
          </Card.Group></>}
        {!loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <Fragment key={'month:' + date.toJSON()}>
          <div className="GroupTitle">
            <SubTitle>{toMonthName(date, { utc: true })}</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => <EventCard key={'event:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenModal} />)}
          </Card.Group>
        </Fragment>)}
      </Container>
    </Layout>
  )
}
