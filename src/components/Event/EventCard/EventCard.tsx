import React, { useMemo } from 'react'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import Avatar from 'decentraland-gatsby/dist/components/Profile/Avatar'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'
import JumpInPosition from '../../Button/JumpInPosition'
import AttendingButtons from '../../Button/AttendingButtons'

import './EventCard.css'
import EventDate from '../EventDate/EventDate'
import StartIn from '../../Badge/StartIn'
import { navigate } from 'gatsby-plugin-intl'
import locations from '../../../modules/locations'

const EVENTS_LIST = 3

export type EventCardProps = {
  event: SessionEventAttributes,
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>, data: SessionEventAttributes) => void,
}

export default function EventCard(props: EventCardProps) {
  const event = props.event
  const nextStartAt = useMemo(() => new Date(Date.parse(event.next_start_at.toString())), [event.next_start_at])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) {
      props.onClick(e, props.event)
    }

    if (!e.defaultPrevented) {
      navigate(locations.event(event.id))
    }
  }

  return (
    <Card link className={TokenList.join(['EventCard', !event.approved && 'pending'])} href={locations.event(event.id)} onClick={handleClick} >
      <div />
      <StartIn date={nextStartAt} />
      {event.total_attendees > 0 && <div className="EventCard__Attendees">
        {event.latest_attendees.slice(0, EVENTS_LIST).map((address) => <Avatar size="mini" key={address} address={address} />)}
        {event.total_attendees > EVENTS_LIST && <div className="EventCard__Attendees__More">
          <div>+{Math.max(event.total_attendees - EVENTS_LIST, 0)}</div>
        </div>}
      </div>}
      <ImgFixed src={event.image || ''} dimension="wide" />
      <Card.Content>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <EventDate event={event} />
          <div>
            <JumpInPosition event={event} onClick={(e) => e.stopPropagation()} />
          </div>
        </div>

        <Card.Header>{event.name}</Card.Header>
        <Card.Description>
          <AttendingButtons event={event} />
        </Card.Description>
      </Card.Content>
    </Card>)
}