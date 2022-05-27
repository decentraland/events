import React, { useCallback, useMemo } from "react"

import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Card } from "decentraland-ui/dist/components/Card/Card"

import { SessionEventAttributes } from "../../../entities/Event/types"
import locations from "../../../modules/locations"
import AttendingButtons from "../../Button/AttendingButtons"
import EventDetail from "../EventModal/EventDetail/EventDetail"
import EventSection from "../EventSection"
import "./EventCardBig.css"

export type EventCardBigProps = {
  event?: SessionEventAttributes
  loading?: boolean
  onClick?: (e: React.MouseEvent<any>, data: SessionEventAttributes) => void
  onChangeEvent?: (
    event: React.MouseEvent<any>,
    data: SessionEventAttributes
  ) => void
}

export default React.memo(function EventCardBig(props: EventCardBigProps) {
  const event = props.event
  const onClick = props.onClick
  const href = useMemo(() => event && locations.event(event.id), [event])
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (event) {
        if (onClick) {
          onClick(e, event)
        }

        if (!e.defaultPrevented) {
          navigate(locations.event(event.id))
        }
      }
    },
    [event, onClick]
  )

  return (
    <Card
      className={TokenList.join([
        "EventCardBig",
        props.loading && "loading",
        event && !event.approved && "pending",
      ])}
      href={href}
      onClick={handleClick}
    >
      <div className="EventCardBig__Container">
        <div className="EventCardBig__Cover">
          <ImgFixed src={event?.image || ""} dimension="wide" />
        </div>
        <Card.Content>
          {event && (
            <EventDetail
              event={event}
              showEdit={false}
              showDescription={false}
              showAttendees={false}
              showContact={false}
              showDetails={false}
              showAllDates={false}
              showCountdownDate={true}
            />
          )}
          <EventSection>
            {event && <AttendingButtons event={event} />}
          </EventSection>
        </Card.Content>
      </div>
    </Card>
  )
})
