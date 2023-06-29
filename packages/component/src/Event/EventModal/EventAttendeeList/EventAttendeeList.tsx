import React, { useState } from "react"

import Avatar from "decentraland-gatsby/dist/components/Profile/Avatar"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Events from "events-api/src/Events"
import { SessionEventAttributes } from "events-type/src/types/Event"
import { EventAttendeeAttributes } from "events-type/src/types/EventAttendee"

import backIcon from "../../../images/popup-back.svg"
import closeIcon from "../../../images/popup-close.svg"

import "./EventAttendeeList.css"

const attendees = new Map<string, EventAttendeeAttributes[]>()

export type EventAttendeeListProps = {
  event: SessionEventAttributes
  onBack?: (
    event: React.MouseEvent<HTMLElement>,
    data: SessionEventAttributes
  ) => void
  onClose?: (
    event: React.MouseEvent<HTMLElement>,
    data: SessionEventAttributes
  ) => void
}

export default function EventAttendeeList(props: EventAttendeeListProps) {
  const [list, setList] = useState(attendees.get(props.event.id))
  const l = useFormatMessage()

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

  return (
    <div className="event-attendee-list">
      <div className="event-attendee-list__header">
        {props.onBack && (
          <img
            src={backIcon}
            width="8"
            height="14"
            className="event-attendee-list__header-back"
            onClick={handleBack}
          />
        )}
        {props.onClose && (
          <img
            src={closeIcon}
            width="14"
            height="14"
            className="event-attendee-list__header-close"
            onClick={handleClose}
          />
        )}
        <SubTitle>
          {l("components.event.event_modal.event_attendee_list.people_going")}
        </SubTitle>
      </div>
      {!list && <Loader size="massive" />}
      {list && list.length === 0 && <div />}
      {list &&
        list.length > 0 &&
        list.map((attendee) => {
          return (
            <div key={attendee.user} className="event-attendee-list__item">
              <Avatar address={attendee.user} />
              <Paragraph>
                {attendee.user_name ||
                  l("components.event.event_modal.event_attendee_list.guest")}
              </Paragraph>
            </div>
          )
        })}
    </div>
  )
}
