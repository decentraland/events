import React, { useMemo, useEffect } from "react"
import { Link } from "gatsby-plugin-intl"
import { navigate } from "gatsby"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import useEntityStore from "decentraland-gatsby/dist/hooks/useEntityStore"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { useLocation } from "@reach/router"
import url from '../url'

import stores from '../store'
import Layout from "../components/Layout/Layout"
import SEO from "../components/seo"
import Events from "../api/Events"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { HeaderMenu } from "decentraland-ui/dist/components/HeaderMenu/HeaderMenu"

import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useMobileDetector from "decentraland-gatsby/dist/hooks/useMobileDetector"
import EventModal from "../components/Event/EventModal/EventModal"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"

import useListEvents from '../hooks/useListEvents'
import useListEventsByMonth from '../hooks/useListEventsByMonth'

import './index.css'
import { EventAttributes } from "../entities/Event/types"
import { toMonthName } from "../components/Date/utils"

const primaryAdd = require('../images/primary-add.svg')

export default function IndexPage(props: any) {
  const [profile] = useProfile()
  const location = useLocation()
  const isMobile = useMobileDetector()
  const now = Date.now()
  const searchParams = new URLSearchParams(location.search)
  const eventId = location && searchParams.get('event') || null
  const isSharing = location && searchParams.get('view') === 'share' || false
  const isListingAttendees = location && searchParams.get('view') === 'attendees' || false
  const isEditing = location && searchParams.get('view') === 'edit' || false
  const state = useEntityStore(stores.event)
  const events = useListEvents(state.data)
  const eventsByMonth = useListEventsByMonth(events)
  const myEvents = useMemo(() => events.filter((event: EventAttributes) => profile && event.user === profile.address.toString()), [state])
  const attendingEvents = useMemo(() => events.filter((event: any) => !!event.attending), [state])
  const happeningEvents = useMemo(() => events.filter(event => event.start_at.getTime() >= now && event.finish_at.getTime() <= now), [state])
  const currentEvent = eventId && state.data[eventId] || null

  useAsyncEffect(async () => {
    stores.event.setLoading()
    const events = await Events.get().getEvents()
    stores.event.setEntities(events)
  }, [profile])

  return (
    <Layout {...props}>
      <SEO title="Decentraland Events" />
      <EventModal event={currentEvent} share={isSharing} attendees={isListingAttendees} edit={isEditing} onClose={() => navigate(url.toHome(location))} />
      <Container style={{ paddingTop: "110px" }}>
        <HeaderMenu>
          <HeaderMenu.Left>
            <Title small>World Events</Title>
          </HeaderMenu.Left>
          <HeaderMenu.Right>
            <Button primary={!isMobile} basic={!!isMobile} size="small" {...{ to: '/submit', as: Link }}>
              <img src={primaryAdd} style={{ width: '16px', height: 'auto', verticalAlign: 'text-bottom', marginRight: '1rem', display: isMobile ? 'none' : '' }} width="16" height="16" />
              SUBMIT EVENT
        </Button>
          </HeaderMenu.Right>
        </HeaderMenu>
        {state.loading && <>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </>}
        {!state.loading && events.length === 0 && <>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </>}
        {!state.loading && events.length > 0 && attendingEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>GOING</SubTitle></div>
          <Card.Group>
            {attendingEvents.map(event => <EventCardMini key={'going:' + event.id} event={event} />)}
          </Card.Group></>}
        {!state.loading && events.length > 0 && myEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>MY EVENTS</SubTitle></div>
          <Card.Group>
            {myEvents.map(event => <EventCardMini key={'my:' + event.id} event={event} />)}
          </Card.Group></>}
        {!state.loading && events.length > 0 && happeningEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>AT THIS MOMENT</SubTitle></div>
          <Card.Group>
            {happeningEvents.map(event => <EventCardMini key={'going:' + event.id} event={event} />)}
          </Card.Group></>}
        {!state.loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <>
          <div className="GroupTitle">
            <SubTitle>{toMonthName(date, { utc: true })}</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => <EventCard key={'event:' + event.id} event={event} />)}
          </Card.Group>
        </>)}
        {/* {!state.loading && eventsByMonth.length > 0 && <>
          <div className="GroupTitle"><SubTitle>COMING SOON</SubTitle></div>
          <Card.Group>
            {events.map((event) => <EventCard key={'event:' + event.id} event={event} />)}
          </Card.Group></>} */}
      </Container>
    </Layout>
  )
}
