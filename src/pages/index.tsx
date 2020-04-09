
import React, { useMemo, useEffect, useState } from "react"
import { useLocation } from "@reach/router"
import { Link } from "gatsby-plugin-intl"
import { navigate } from "gatsby"

import Layout from "../components/Layout/Layout"
import Responsive from 'semantic-ui-react/dist/commonjs/addons/Responsive/Responsive'
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import useEntityStore from "decentraland-gatsby/dist/hooks/useEntityStore"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { HeaderMenu } from "decentraland-ui/dist/components/HeaderMenu/HeaderMenu"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import track from 'decentraland-gatsby/dist/components/Segment/track'
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import useListEvents from '../hooks/useListEvents'
import useListEventsByMonth from '../hooks/useListEventsByMonth'
import { EventAttributes } from "../entities/Event/types"
import { toMonthName } from "../components/Date/utils"
import WalletRequiredModal from "../components/WalletRequiredModal/WalletRequiredModal"
import SEO from "../components/seo"
import Events from "../api/Events"
import url from '../utils/url'
import stores from '../utils/store'
import * as segment from '../utils/segment'

import './index.css'

const primaryAdd = require('../images/primary-add.svg')

export default function IndexPage(props: any) {
  const [profile, actions] = useProfile()
  const location = useLocation()
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
  const happeningEvents = useMemo(() => events.filter(event => event.approved && !event.rejected && event.start_at.getTime() <= now && event.finish_at.getTime() >= now), [state])
  const currentEvent = eventId && state.data[eventId] || null

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
    stores.event.setLoading()
    const events = await Events.get().getEvents()
    stores.event.setEntities(events)
  }, [profile])

  return (
    <Layout {...props}>
      <SEO title={title} />
      <WalletRequiredModal open={requireWallet} onClose={() => setRequireWallet(false)} />
      <EventModal event={currentEvent} share={isSharing} attendees={isListingAttendees} edit={isEditing} onClose={() => navigate(url.toHome(location))} />
      <Container style={{ paddingTop: "110px" }}>
        <HeaderMenu>
          <HeaderMenu.Left>
            <Title small>World Events</Title>
          </HeaderMenu.Left>
          <HeaderMenu.Right>
            <Responsive
              minWidth={Responsive.onlyTablet.minWidth}
            >
              <Button primary size="small" as={Link} to="/submit">
                <img src={primaryAdd} style={{ width: '16px', height: 'auto', verticalAlign: 'text-bottom', marginRight: '1rem' }} width="16" height="16" />
                  SUBMIT EVENT
            </Button>
            </Responsive>
            {actions.provider && <Responsive
              maxWidth={Responsive.onlyMobile.maxWidth}
            >
              <Button basic size="small" as={Link} to="/submit">
                SUBMIT EVENT
            </Button>
            </Responsive>}
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
      </Container>
    </Layout>
  )
}
