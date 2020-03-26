import React from 'react'
import { EventAttributes } from '../../../entities/Event/types'
import { navigate } from 'gatsby'
import url from '../../../url'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import { useLocation } from '@reach/router'
import classname from 'decentraland-gatsby/dist/utils/classname'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import JumpInButton from '../../Button/JumpInButton'
import SocialButton from '../../Button/SocialButtons'
import { toMonthName } from '../../Date/utils'

import './EventCard.css'

const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 3

export type EventCardProps = {
  event: EventAttributes
}

export default function EventCard(props: EventCardProps) {
  const event = props.event
  const startAt = new Date(Date.parse(event.start_at.toString()))
  const location = useLocation()

  function handleOpen(e: React.MouseEvent<any>) {
    e.preventDefault()
    navigate(url.toEvent(location, event.id))
  }

  function handleShare(e: React.MouseEvent<any>) {
    e.preventDefault()
    navigate(url.toEventShare(location, event.id))
  }

  return (
    <Card key={event.id} link className={classname(['EventCardMini', !event.approved && 'pending'])} href={url.toEvent(location, event.id)} onClick={handleOpen} >
      <div className="EventCardMini__Attendees">
        {event.latest_attendees.slice(0, EVENTS_LIST).map((address) => <ImgAvatar size="mini" address={address} src={`${EVENTS_URL}/profile/${address}/face.png`} />)}
        <div className="EventCardMini__Attendees__More">
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
}