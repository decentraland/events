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
import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { HeaderMenu } from "decentraland-ui/dist/components/HeaderMenu/HeaderMenu"

import './index.css'
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useMobileDetector from "decentraland-gatsby/dist/hooks/useMobileDetector"
import EventModal from "../components/EventModal/EventModal"
import JumpInButton from "../components/Button/JumpInButton"
import { toMonthName } from "../components/Date/utils"
import classname from "decentraland-gatsby/dist/utils/classname"
import SocialButton from "../components/Button/SocialButtons"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import ImgAvatar from "decentraland-gatsby/dist/components/Profile/ImgAvatar"

const primaryAdd = require('../images/primary-add.svg')
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 3

export default function IndexPage(props: any) {
  const [profile] = useProfile()
  const location = useLocation()
  const isMobile = useMobileDetector()
  const searchParams = new URLSearchParams(location.search)
  const eventId = location && searchParams.get('event') || null
  const isSharing = location && searchParams.get('view') === 'share' || false
  const isListingAttendees = location && searchParams.get('view') === 'attendees' || false
  const state = useEntityStore(stores.event)
  const events = useMemo(() => Object.values(state.data).sort((a, b) => a.start_at.getTime() - b.start_at.getTime()), [state])
  const attendingEvents = useMemo(() => events.filter(event => (event as any).attending), [state])
  const currentEvent = eventId && state.data[eventId] || null

  useAsyncEffect(async () => {
    stores.event.setLoading()
    const events = await Events.get().getEvents()
    stores.event.setEntities(events)
  }, [profile])

  return (
    <Layout {...props}>
      <SEO title="Decentraland Events" />
      <EventModal size="tiny" event={currentEvent} share={isSharing} attendees={isListingAttendees} onClose={() => navigate(url.toHome(location))} />
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
          <Paragraph secondary style={{ textAlign: 'center' }}>There are not events coming soon.</Paragraph>
          <Divider />
        </>}
        {!state.loading && events.length > 0 && attendingEvents.length > 0 && <>
          <div className="GroupTitle"><SubTitle>GOING</SubTitle></div>
          <Card.Group>
            {attendingEvents.map(event => {
              const startAt = new Date(Date.parse(event.start_at.toString()))
              function handleOpenEvent(e: React.MouseEvent<any>) {
                e.preventDefault()
                navigate(url.toEvent(location, event.id))
              }

              return <Card key={'attending-' + event.id} className="CardGoingEvent" href={url.toEvent(location, event.id)} onClick={handleOpenEvent}>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: '0 0 96px', position: 'relative' }}>
                    <JumpInButton size="small" event={event}>{''}</JumpInButton>
                    <ImgFixed src={event.image} dimension="square" />
                    <div className="CardGoingEvent__Attendees">
                      <div className="CardGoingEvent__Attendees__More">
                        +{event.total_attendees}
                      </div>
                    </div>
                  </div>
                  <Card.Content>
                    <div className="date">{toMonthName(startAt)}{' '}{startAt.getDate()}</div>
                    <Card.Header>{event.name}</Card.Header>
                  </Card.Content>
                </div>
              </Card>
            })}
          </Card.Group></>}
        {!state.loading && events.length > 0 && <>
          <div className="GroupTitle"><SubTitle>COMING SOON</SubTitle></div>
          <Card.Group>
            {events.map((event) => {
              const startAt = new Date(Date.parse(event.start_at.toString()))

              function handleOpen(e: React.MouseEvent<any>) {
                e.preventDefault()
                navigate(url.toEvent(location, event.id))
              }

              function handleShare(e: React.MouseEvent<any>) {
                e.preventDefault()
                navigate(url.toEventShare(location, event.id))
              }

              return (
                <Card key={event.id} link className={classname(['CardEvent', !event.approved && 'pending'])} href={url.toEvent(location, event.id)} onClick={handleOpen} >
                  <div className="CardEvent__Attendees">
                    {event.latest_attendees.slice(0, EVENTS_LIST).map((address) => <ImgAvatar size="mini" address={address} src={`${EVENTS_URL}/profile/${address}/face.png`} />)}
                    <div className="CardEvent__Attendees__More">
                      +{Math.max(event.total_attendees - EVENTS_LIST, 0)}
                    </div>
                  </div>
                  <ImgFixed src={event.image} dimension="wide" />
                  <Card.Content>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="date">{toMonthName(startAt)}{' '}{startAt.getDate()}</div>
                      <div>
                        <JumpInButton size="small" event={event} />
                      </div>
                    </div>

                    <Card.Header>{event.name}</Card.Header>
                    <Card.Description>
                      <SocialButton event={event} onShareFallback={handleShare} />
                    </Card.Description>
                  </Card.Content>
                </Card>)
            })}
          </Card.Group></>}
      </Container>
    </Layout>
  )
}
