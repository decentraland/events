
import React, { useMemo, useEffect, useState, Fragment } from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import Layout from "../components/Layout/Layout"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { toMonthName } from "decentraland-gatsby/dist/components/Date/utils"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"

import EventModal from "../components/Event/EventModal/EventModal"
import EventCard from "../components/Event/EventCard/EventCard"
import EventCardMini from "../components/Event/EventCardMini/EventCardMini"
import EventCardBig from "../components/Event/EventCardBig/EventCardBig"
import Carousel from "../components/Carousel/Carousel"
import SubmitButton from "../components/Button/SubmitButton"
import useListEvents from '../hooks/useListEvents'
import useListEventsByMonth from '../hooks/useListEventsByMonth'
import { EventAttributes, SessionEventAttributes } from "../entities/Event/types"
import WalletRequiredModal from "../components/Modal/WalletRequiredModal"
import SEO from "../components/seo"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../utils/segment'
import useAnalytics from "../hooks/useAnalytics"

import './index.css'

const invertedAdd = require('../images/inverted-add.svg')

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage(props: any) {
  const now = Date.now()
  const [state, patchState] = usePatchState<IndexPageState>({ updating: {} })
  const location = useLocation()
  const eventId = url.getEventId(location)
  const isListingAttendees = url.isEventAttendees(location)
  const siteStore = useSiteStore(props.location)
  const events = useListEvents(siteStore.events.getState().data)
  const eventsByMonth = useListEventsByMonth(events)
  const trendingEvents = useMemo(() => events.filter((event) => !!event.highlighted), [siteStore.events.getState()])
  const liveEvents = useMemo(() => events.filter((event) => event.approved && now >= event.next_start_at.getTime() && now < event.next_start_at.getTime() + event.duration).reverse(), [siteStore.events.getState()])
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

  function handleMyEvents(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(url.toMyEvents(location), siteStore.getNavigationState())
  }

  function handleCloseModal(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(url.toHome(location), siteStore.getNavigationState())
  }

  function handleOpenEdit(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEventEdit(location, data.id), siteStore.getNavigationState())
  }

  function handleOpenEventDetail(event: React.MouseEvent<any>, data: SessionEventAttributes) {
    event.preventDefault()
    navigate(url.toEvent(location, data.id), siteStore.getNavigationState())
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
        onClickDetails={handleOpenEventDetail}
        onClickAttendees={handleOpenAttendees}
        onChangeEvent={handleChangeEvent}
      />
      <div style={{ paddingTop: "75px" }} />
      <Tabs>
        <Tabs.Tab active>World Events</Tabs.Tab>
        {siteStore.profile && <Tabs.Tab onClick={handleMyEvents}>My Events</Tabs.Tab>}
        <SubmitButton onClick={handleSubmit} />
      </Tabs>
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
        {!siteStore.loading && events.length > 0 && liveEvents.length > 0 && <div><Carousel>
          {liveEvents.map(event => <EventCardBig
            key={'live:' + event.id}
            event={event}
            updating={state.updating[event.id]}
            href={url.toEvent(location, event.id)}
            onChangeEvent={handleChangeEvent}
            onClickEdit={handleOpenEdit}
            onClick={handleOpenEventDetail}
          />)}
        </Carousel></div>}
        {!siteStore.loading && events.length > 0 && trendingEvents.length > 0 && <div>
          <div className="GroupTitle"><SubTitle>TRENDING</SubTitle></div>
          <Card.Group>
            {trendingEvents.map(event => <EventCardMini key={'trending:' + event.id} event={event} href={url.toEvent(location, event.id)} onClick={handleOpenEventDetail} />)}
          </Card.Group></div>}
        {!siteStore.loading && eventsByMonth.length > 0 && eventsByMonth.map(([date, events]) => <Fragment key={'month:' + date.toJSON()}>
          <div className="GroupTitle">
            <SubTitle>{toMonthName(date, { utc: true })}</SubTitle>
          </div>
          <Card.Group>
            {events.map((event) => <EventCard
              key={'event:' + event.id}
              event={event}
              updating={state.updating[event.id]}
              href={url.toEvent(location, event.id)}
              onChangeEvent={handleChangeEvent}
              onClick={handleOpenEventDetail}
            />)}
          </Card.Group>
        </Fragment>)}
      </Container>
    </Layout>
  )
}
