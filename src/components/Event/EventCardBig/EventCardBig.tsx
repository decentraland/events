import React from 'react'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'

import './EventCardBig.css'
import EventDetail from '../EventModal/EventDetail/EventDetail'
import EventSection from '../EventSection'
import AttendingButtons from '../../Button/AttendingButtons'

export type EventCardBigProps = {
  event: SessionEventAttributes,
  href?: string,
  updating?: boolean
  onClick?: (e: React.MouseEvent<any>, data: SessionEventAttributes) => void,
  onClickEdit?: (e: React.MouseEvent<any>, data: SessionEventAttributes) => void,
  onChangeEvent?: (event: React.MouseEvent<any>, data: SessionEventAttributes) => void
}

export default function EventCardBig(props: EventCardBigProps) {
  const event = props.event
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (props.onClick) {
      props.onClick(e, props.event)
    }
  }

  return <Card className={TokenList.join(['EventCardBig', !event.approved && 'pending'])} href={props.href} onClick={handleClick}>
    <div className="EventCardBig__Container">
      <div style={{ flex: '0 0 58%', position: 'relative' }}>
        <ImgFixed src={event.image || ''} dimension="wide" />
      </div>
      <Card.Content style={{ flex: 1 }}>
        <EventDetail
          event={event}
          showDescription={false}
          showAttendees={false}
          showContact={false}
          showDetails={false}
          onClickEdit={props.onClickEdit}
        />
        <EventSection.Divider />
        <EventSection style={{ paddingTop: '28px' }}>
          <AttendingButtons loading={props.updating} event={event} onChangeEvent={props.onChangeEvent} />
        </EventSection>
      </Card.Content>
    </div>
  </Card>
}