import React from 'react'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'

import './EventCardBig.css'
import EventDetail from '../EventModal/EventDetail/EventDetail'
import EventSection from '../EventSection'
import AttendingButtons from '../../Button/AttendingButtons'
import locations from '../../../modules/locations'
import { navigate } from 'gatsby-plugin-intl'

export type EventCardBigProps = {
  event: SessionEventAttributes,
  onClick?: (e: React.MouseEvent<any>, data: SessionEventAttributes) => void,
  onChangeEvent?: (event: React.MouseEvent<any>, data: SessionEventAttributes) => void
}

export default function EventCardBig(props: EventCardBigProps) {
  const event = props.event
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) {
      props.onClick(e, props.event)
    }

    if (!e.defaultPrevented) {
      navigate(locations.event(event.id))
    }
  }

  return <Card className={TokenList.join(['EventCardBig', !event.approved && 'pending'])} href={locations.event(event.id)} onClick={handleClick}>
    <div className="EventCardBig__Container">
      <div className="EventCardBig__Cover">
        <ImgFixed src={event.image || ''} dimension="wide" />
      </div>
      <Card.Content>
        <EventDetail
          event={event}
          showDescription={false}
          showAttendees={false}
          showContact={false}
          showDetails={false}
          showAllDates={false}
          showCountdownDate={true}
        />
        <EventSection>
          <AttendingButtons event={event} />
        </EventSection>
      </Card.Content>
    </div>
  </Card>
}