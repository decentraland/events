import React from 'react'
import { EventAttributes } from '../../../entities/Event/types'
import { navigate } from 'gatsby'
import url from '../../../url'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import { useLocation } from '@reach/router'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import JumpInButton from '../../Button/JumpInButton'
import { toMonthName } from '../../Date/utils'

import './EventCardMini.css'
import classname from 'decentraland-gatsby/dist/utils/classname'

const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 3

export type EventCardMiniProps = {
  event: EventAttributes
}

export default function EventCardMini(props: EventCardMiniProps) {
  const event = props.event
  const location = useLocation()
  const startAt = new Date(Date.parse(event.start_at.toString()))
  function handleOpenEvent(e: React.MouseEvent<any>) {
    e.preventDefault()
    navigate(url.toEvent(location, event.id))
  }

  return <Card key={'attending-' + event.id} className={classname(['EventCardMini', !event.approved && 'pending'])} href={url.toEvent(location, event.id)} onClick={handleOpenEvent}>
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 96px', position: 'relative' }}>
        <JumpInButton size="small" event={event}>{''}</JumpInButton>
        <ImgFixed src={event.image} dimension="square" />
        <div className="EventCardMini__Attendees">
          <div className="EventCardMini__Attendees__More">
            +{event.total_attendees}
          </div>
        </div>
      </div>
      <Card.Content>
        <div className="date">{toMonthName(startAt, { utc: true })}{' '}{startAt.getUTCDate()}</div>
        <Card.Header>{event.name}</Card.Header>
      </Card.Content>
    </div>
  </Card>
}