import React, { useState, useEffect } from "react"
import { Link } from "gatsby-plugin-intl"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import useLoader from "decentraland-gatsby/dist/hooks/useLoader"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import Layout from "../components/Layout/Layout"
import Image from "../components/image"
import SEO from "../components/seo"
import Events from "../api/Events"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Code from "decentraland-gatsby/dist/components/Text/Code"
import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { HeaderMenu } from "decentraland-ui/dist/components/HeaderMenu/HeaderMenu"

import './index.css'

const primaryAdd = require('../images/primary-add.svg')
const share = require('../images/share.svg')
const jumpIn = require('../images/jump-in.svg')

const month: Record<number, string> = {
  0: 'JANUARY',
  1: 'FEBRUARY',
  2: 'MARCH',
  3: 'APRIL',
  4: 'MAY',
  5: 'JUNE',
  6: 'JULY',
  7: 'AUGUST',
  8: 'SEPTEMBER',
  9: 'OCTOBER',
  10: 'NOVEMBER',
  11: 'DECEMBER',
}



async function EventLoader() {
  return Events.get().getEvents()
}

async function EventAttending(address: string | undefined) {
  if (!address) {
    return null
  }

  return Events.get().getAttendingEvent()
}

export default function IndexPage(props: any) {
  const [profile] = useProfile()
  const [events, loadEvents] = useLoader(EventLoader)
  const [attendingEvents, loadAttendingEvents] = useLoader(EventAttending)

  useEffect(() => {
    loadEvents()
    loadAttendingEvents(profile?.address && profile?.address.toString())
  }, [profile])

  return (
    <Layout {...props}>
      <SEO title="Home" />
      <Container style={{ paddingTop: "110px" }}>
        <HeaderMenu>
          <HeaderMenu.Left>
            <Title small>World Events</Title>
          </HeaderMenu.Left>
          <HeaderMenu.Right>
            <Button primary size="small" {...{ to: '/submit', as: Link }}>
              <img src={primaryAdd} style={{ width: '16px', height: 'auto', verticalAlign: 'text-bottom', marginRight: '1rem' }} width="16" height="16" />
          SUMMIT EVENT
        </Button>
          </HeaderMenu.Right>
        </HeaderMenu>
        <Card.Group style={{ paddingTop: '40px' }}>
          {events && events.map((event) => {

            const startAt = new Date(Date.parse(event.start_at.toString()))

            return (
              <Card key={event.id} className="CardEvent">
                <ImgFixed src={event.image} dimension="wide" />
                <Card.Content>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="date">{month[startAt.getMonth()]}{' '}{startAt.getDate()}</div>
                    <div>
                      <Button size="small" basic style={{ padding: '0' }} href={`https://play.decentraland.org/?position=${event.coordinates.join(',')}`} target="_blank">
                        JUMP IN
                        <img src={jumpIn} style={{ marginLeft: '.5em', width: '16px' }} />
                      </Button>
                    </div>
                  </div>

                  <Card.Header>{event.name}</Card.Header>
                  <Card.Description>
                    {event.description}
                  </Card.Description>
                </Card.Content>
                <Card.Content>
                  <Card.Description>
                    <Button inverted size="small" style={{ width: 'calc(100% - 46px)', borderColor: '#ddd' }}>WANT TO GO</Button>
                    <Button inverted primary size="small" style={{ minWidth: '34px', padding: '5px 2px', margin: '0 0 0 8px' }}>
                      <img src={share} width="16px" />
                    </Button>
                  </Card.Description>
                </Card.Content>
              </Card>)
          })}
        </Card.Group>
      </Container>
    </Layout>
  )
}
