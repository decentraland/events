import React, { useState } from 'react'
import { EventAttendeeAttributes } from '../../../../entities/EventAttendee/types'
import { SessionEventAttributes } from '../../../../entities/Event/types'
import useAsyncEffect from 'decentraland-gatsby/dist/hooks/useAsyncEffect'
import Events from '../../../../api/Events'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'

import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Avatar from 'decentraland-gatsby/dist/components/Profile/Avatar'
import backIcon from '../../../../images/popup-back.svg'
import closeIcon from '../../../../images/popup-close.svg'

import './EventAttendeeList.css'


const attendees = new Map<string, EventAttendeeAttributes[]>()

export type EventAttendeeListProps = {
  event: SessionEventAttributes,
  onBack?: (event: React.MouseEvent<HTMLElement>, data: SessionEventAttributes) => void
  onClose?: (event: React.MouseEvent<HTMLElement>, data: SessionEventAttributes) => void
}

export default function EventAttendeeList(props: EventAttendeeListProps) {

  const [list, setList] = useState(attendees.get(props.event.id))

  useAsyncEffect(async () => {
    const result = await Events.get().getEventAttending(props.event.id)
    attendees.set(props.event.id, result)
    setList(result)
  }, [props.event.id])

  function handleBack(e: React.MouseEvent<HTMLElement>) {
    if (props.onBack) {
      props.onBack(e, props.event)
    }
  }

  function handleClose(e: React.MouseEvent<HTMLElement>) {
    if (props.onClose) {
      props.onClose(e, props.event)
    }
  }

  return <div className="EventAttendeeList">
    <div className="EventAttendeeList__Header">
      {props.onBack && <img src={backIcon} width="8" height="14" className="EventAttendeeList__Header__Back" onClick={handleBack} />}
      {props.onClose && <img src={closeIcon} width="14" height="14" className="EventAttendeeList__Header__Close" onClick={handleClose} />}
      <SubTitle>People going</SubTitle>
    </div>
    {!list && <Loader size="massive" />}
    {list && list.length === 0 && <div />}
    {list && list.length > 0 && list.map((attendee) => {
      return <div key={attendee.user} className="EventAttendeeList__Item">
        <Avatar address={attendee.user} />
        <Paragraph>{attendee.user_name || 'Guest'}</Paragraph>
      </div>
    })}
  </div>
}