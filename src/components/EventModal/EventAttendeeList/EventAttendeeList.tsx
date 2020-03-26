import React, { useState } from 'react'
import { useLocation } from "@reach/router"
import { EventAttendeeAttributes } from '../../../entities/EventAttendee/types'
import { EventAttributes } from '../../../entities/Event/types'
import useAsyncEffect from 'decentraland-gatsby/dist/hooks/useAsyncEffect'
import Events from '../../../api/Events'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'

import './EventAttendeeList.css'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import { navigate } from 'gatsby'
import url from '../../../url'

const back = require('../../../images/back.svg')

const attendees = new Map<string, EventAttendeeAttributes[]>()

export type EventAttendeeListProps = {
  event: EventAttributes,
  onBack?: (e: React.EventHandler<any>) => void
}

export default function EventAttendeeList(props: EventAttendeeListProps) {

  const [list, setList] = useState(attendees.get(props.event.id))
  const location = useLocation()

  useAsyncEffect(async () => {
    if (!list) {
      const result = await Events.get().getEventAttending(props.event.id)
      attendees.set(props.event.id, result)
      setList(result)
    }
  }, [props.event.id])

  return <div className="EventAttendeeList">
    <div className="EventAttendeeList__Header">
      <img src={back} width="8" height="16" onClick={() => navigate(url.toEvent(location, props.event.id))} />
      <SubTitle>People going</SubTitle>
    </div>
    {!list && <Loader size="massive" />}
    {list && list.length === 0 && <div />}
    {list && list.length > 0 && list.map((attendee) => {
      return <div className="EventAttendeeList__Item">
        <ImgAvatar address={attendee.user} />
        <Paragraph>{attendee.user_name}</Paragraph>
      </div>
    })}
  </div>
}