import React from 'react'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'
import JumpInPosition from '../../Button/JumpInPosition'
import EventDate from '../EventDate/EventDate'

import './EventCardMini.css'
import { navigate } from 'gatsby-plugin-intl'
import locations from '../../../modules/locations'

export type EventCardMiniProps = {
  event: SessionEventAttributes
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>, data: SessionEventAttributes) => void,
}

export default function EventCardMini(props: EventCardMiniProps) {
  const event = props.event
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) {
      props.onClick(e, props.event)
    }

    if (!e.defaultPrevented) {
      navigate(locations.event(event.id))
    }
  }

  return <Card className={TokenList.join(['EventCardMini', !event.approved && 'pending'])} href={locations.event(event.id)} onClick={handleClick}>
    <JumpInPosition event={event} compact onClick={(e) => e.stopPropagation()} />
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