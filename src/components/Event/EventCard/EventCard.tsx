import React from 'react'
import { navigate } from 'gatsby'
import { useLocation } from '@reach/router'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { toMonthName } from 'decentraland-gatsby/dist/components/Date/utils'
import { EventAttributes } from '../../../entities/Event/types'
import JumpInButton from '../../Button/JumpInButton'
import AttendingButtons from '../../Button/AttendingButtons'
import url from '../../../utils/url'

import './EventCard.css'

const info = require('../../../images/primary-info.svg')

const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 3

export type EventCardProps = {
  event: EventAttributes
}

export default function EventCard(props: EventCardProps) {
  const event = props.event
  const now = Date.now()
  const startAt = new Date(Date.parse(event.start_at.toString()))
  const finishAt = new Date(Date.parse(event.finish_at.toString()))
  const rightNow = now >= startAt.getTime() && now <= finishAt.getTime()
  const location = useLocation()

  function handleOpen(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()
    navigate(url.toEvent(location, event.id))
  }

  return (
    <Card key={event.id} link className={TokenList.join(['EventCard', !event.approved && 'pending'])} href={url.toEvent(location, event.id)} onClick={handleOpen} >
      {rightNow && <div className="EventCard__Now">
        <span>NOW</span>
      </div>}
      {event.total_attendees > 0 && <div className="EventCard__Attendees">
        {event.latest_attendees.slice(0, EVENTS_LIST).map((address) => <ImgAvatar size="mini" key={address} address={address} src={`${EVENTS_URL}/profile/${address.toString()}/face.png`} />)}
        {event.total_attendees > EVENTS_LIST && <div className="EventCard__Attendees__More">
          <div>+{Math.max(event.total_attendees - EVENTS_LIST, 0)}</div>
        </div>}
      </div>}
      <ImgFixed src={event.image} dimension="wide" />
      <Card.Content>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="date">{toMonthName(startAt, { utc: true })}{' '}{startAt.getUTCDate()}</div>
          <div>
            <JumpInButton size="small" event={event} />
          </div>
        </div>

        <Card.Header>{event.name}</Card.Header>
        <Card.Description>
          <AttendingButtons event={event} />
        </Card.Description>
      </Card.Content>
    </Card>)
}