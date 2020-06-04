import React from 'react'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'
import JumpInButton from '../../Button/JumpInButton'
import EventDate from '../EventDate/EventDate'

import './EventCardMini.css'

export type EventCardMiniProps = {
  event: SessionEventAttributes,
  href?: string,
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>, data: SessionEventAttributes) => void,
}

export default function EventCardMini(props: EventCardMiniProps) {
  const event = props.event
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) {
      props.onClick(e, props.event)
    }
  }

  return <Card className={TokenList.join(['EventCardMini', !event.approved && 'pending'])} href={props.href} onClick={handleClick}>
    <JumpInButton event={event} compact />
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 96px', position: 'relative' }}>
        <ImgFixed src={event.image || ''} dimension="square" />
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