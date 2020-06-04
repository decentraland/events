import React from 'react'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'
import Live from '../../Badge/Live'
import JumpInButton from '../../Button/JumpInButton'
import AttendingButtons from '../../Button/AttendingButtons'

import './EventCard.css'
import EventDate from '../EventDate/EventDate'

const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 3

export type EventCardProps = {
  event: SessionEventAttributes,
  href?: string,
  updating?: boolean,
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>, data: SessionEventAttributes) => void,
  onChangeEvent?: (e: React.MouseEvent<HTMLAnchorElement>, data: SessionEventAttributes) => void,
}

export default function EventCard(props: EventCardProps) {
  const event = props.event
  const now = Date.now()
  const startAt = new Date(Date.parse(event.start_at.toString()))
  const finishAt = new Date(Date.parse(event.finish_at.toString()))
  const live = now >= startAt.getTime() && now <= finishAt.getTime()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) {
      props.onClick(e, props.event)
    }
  }

  return (
    <Card link className={TokenList.join(['EventCard', !event.approved && 'pending'])} href={props.href} onClick={handleClick} >
      <div />
      {live && <Live primary={event.approved} />}
      {event.total_attendees > 0 && <div className="EventCard__Attendees">
        {event.latest_attendees.slice(0, EVENTS_LIST).map((address) => <ImgAvatar size="mini" key={address} address={address} src={`${EVENTS_URL}/profile/${address.toString()}/face.png`} />)}
        {event.total_attendees > EVENTS_LIST && <div className="EventCard__Attendees__More">
          <div>+{Math.max(event.total_attendees - EVENTS_LIST, 0)}</div>
        </div>}
      </div>}
      <ImgFixed src={event.image || ''} dimension="wide" />
      <Card.Content>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <EventDate event={event} />
          <div>
            <JumpInButton event={event} />
          </div>
        </div>

        <Card.Header>{event.name}</Card.Header>
        <Card.Description>
          <AttendingButtons event={event} loading={props.updating} onChangeEvent={props.onChangeEvent} />
        </Card.Description>
      </Card.Content>
    </Card>)
}