import React from 'react'
import { navigate } from 'gatsby'
import { useLocation } from '@reach/router'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'
import JumpInButton from '../../Button/JumpInButton'
import EventDate from '../EventDate/EventDate'

import url from '../../../utils/url'

import './EventCardMini.css'

export type EventCardMiniProps = {
  event: SessionEventAttributes
}

export default function EventCardMini(props: EventCardMiniProps) {
  const event = props.event
  const location = useLocation()
  function handleOpenEvent(e: React.MouseEvent<any>) {
    e.preventDefault()
    navigate(url.toEvent(location, event.id))
  }

  return <Card key={'attending:' + event.id} className={TokenList.join(['EventCardMini', !event.approved && 'pending'])} href={url.toEvent(location, event.id)} onClick={handleOpenEvent}>
    <JumpInButton event={event} compact />
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 96px', position: 'relative' }}>
        <ImgFixed src={event.image} dimension="square" />
        <div className="EventCardMini__Attendees">
          <div className="EventCardMini__Attendees__More">
            +{event.total_attendees}
          </div>
        </div>
      </div>
      <Card.Content>
        <EventDate event={event} />
        <Card.Header>{event.name}</Card.Header>
      </Card.Content>
    </div>
  </Card>
}