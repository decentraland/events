
import React, { useMemo, useEffect, useState, Fragment } from "react"
import { useLocation } from "@reach/router"
import { Link } from "gatsby-plugin-intl"
import { navigate } from "gatsby"

import Layout from "../components/Layout/Layout"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import useEntityStore from "decentraland-gatsby/dist/hooks/useEntityStore"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import track from 'decentraland-gatsby/dist/components/Segment/track'
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { toMonthName } from "decentraland-gatsby/dist/components/Date/utils"
import API from "decentraland-gatsby/dist/utils/api/API"

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
import stores from '../utils/store'
import * as segment from '../utils/segment'

import './index.css'

const invertedAdd = require('../images/inverted-add.svg')

export default function IndexPage(props: any) {
  const [profile, actions] = useProfile()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const eventId = location && searchParams.get('event') || null
  const isListingAttendees = location && searchParams.get('view') === 'attendees' || false
  const isEditing = location && searchParams.get('view') === 'edit' || false
  const state = useEntityStore(stores.event)
  const events = useListEvents(state.data)
  const eventsByMonth = useListEventsByMonth(events)
  const myEvents = useMemo(() => events.filter((event: EventAttributes) => profile && event.user === profile.address.toString()), [state])
  const attendingEvents = useMemo(() => events.filter((event: any) => !!event.attending), [state])
  const currentEvent = eventId && state.data[eventId] || null
  const loading = actions.loading || state.loading

  const [requireWallet, setRequireWallet] = useState(false)
  useEffect(() => {
    if (Boolean(actions.error && actions.error.code === 'CONNECT_ERROR')) {
      setRequireWallet(true)
    }
  }, [actions.error, actions.error && actions.error.code])

  const title = currentEvent && currentEvent.name || "Decentraland Events"
  const path = url.toUrl(location.pathname, location.search)
  useEffect(() => track((analytics) => {
    const name = currentEvent ? segment.Page.Event : segment.Page.Home
    analytics.page(name, { title, path })
  }), [path])

  useAsyncEffect(async () => {
    if (!actions.loading) {
      stores.event.setLoading()
      stores.event.clear()

      const [events, event] = await Promise.all([
        API.catch(Events.get().getEvents()),
        eventId && API.catch(Events.get().getEventById(eventId))
      ])

      const newEvents: SessionEventAttributes[] = events || []

      if (event) {
        newEvents.push(event)
      }

      stores.event.setEntities(events)
    }
  }, [profile, actions.loading])

  return (
    <Layout {...props}>
      <SEO title={title} />
      <WalletRequiredModal open={requireWallet} onClose={() => setRequireWallet(false)} />
      <EventModal event={currentEvent} attendees={isListingAttendees} edit={isEditing} onClose={() => navigate(url.toHome(location))} />
      <div style={{ paddingTop: "75px" }} />
      <Tabs>
        <Tabs.Tab active>World Events</Tabs.Tab>
        {/* <Tabs.Tab>My Assets</Tabs.Tab> */}
        {/* <div style={{ flex: 1 }} /> */}
        <Button basic size="small" as={Link} to="/submit">
          <img src={invertedAdd} style={{ width: '16px', height: 'auto', verticalAlign: 'text-bottom', marginRight: '1rem' }} width="16" height="16" />
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
            {attendingEvents.map(event => <EventCardMini key={'going:' + event.id} event={event} />)}
          </Card.Group></>}
        {!loading && events.length > 0 && myEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>MY EVENTS</SubTitle></div>
          <Card.Group>
            {myEvents.map(event => <EventCardMini key={'my:' + event.id} event={event} />)}
          </Card.Group></>}
        {!loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <Fragment key={'month:' + date.toJSON()}>
          <div className="GroupTitle">
            <SubTitle>{toMonthName(date, { utc: true })}</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => <EventCard key={'event:' + event.id} event={event} />)}
          </Card.Group>
        </Fragment>)}
      </Container>
    </Layout>
  )
}
