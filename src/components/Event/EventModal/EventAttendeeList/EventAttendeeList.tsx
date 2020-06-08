import React, { useState } from 'react'
import { useLocation } from "@reach/router"
import { EventAttendeeAttributes } from '../../../../entities/EventAttendee/types'
import { EventAttributes, SessionEventAttributes } from '../../../../entities/Event/types'
import useAsyncEffect from 'decentraland-gatsby/dist/hooks/useAsyncEffect'
import Events from '../../../../api/Events'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'

import './EventAttendeeList.css'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import { navigate } from 'gatsby'
import url from '../../../../utils/url'

const back = require('../../../../images/popup-back.svg')
const close = require('../../../../images/popup-close.svg')
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'

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
      {props.onBack && <img src={back} width="8" height="14" className="EventAttendeeList__Header__Back" onClick={handleBack} />}
      {props.onClose && <img src={close} width="14" height="14" className="EventAttendeeList__Header__Close" onClick={handleClose} />}
      <SubTitle>People going</SubTitle>
    </div>
    {!list && <Loader size="massive" />}
    {list && list.length === 0 && <div />}
    {list && list.length > 0 && list.map((attendee) => {
      return <div key={attendee.user} className="EventAttendeeList__Item">
        <ImgAvatar address={attendee.user} src={`${EVENTS_URL}/profile/${attendee.user.toString()}/face.png`} />
        <Paragraph>{attendee.user_name || 'Guest'}</Paragraph>
      </div>
    })}
  </div>
}