import React, { useMemo } from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { SessionEventAttributes } from "events-type/src/types/Event"
import { useProfileSettingsContext } from "events-web/src/context/ProfileSetting"
import { navigateEventDetail } from "events-web/src/modules/events"

import EventCard from "../EventCard/EventCard"

export type ListMonthEventsProps = {
  events?: SessionEventAttributes[]
  date?: Date
  itemsPerRow?: 1 | 2 | 3
  loading?: boolean
}

export const ListMonthEvents = React.memo((props: ListMonthEventsProps) => {
  const [settings] = useProfileSettingsContext()
  const month = useMemo(() => {
    const utc = !settings.use_local_time
    return Time.from(props.date || new Date(), {
      utc,
    }).format("MMMM")
  }, [props.date, settings.use_local_time])

  const events = useMemo(() => props.events || [], [props.events])

  return (
    <div>
      <div className="list-events__group-title">
        <SubTitle>{month}</SubTitle>
      </div>

      {props.loading && (
        <Card.Group itemsPerRow={props.itemsPerRow ?? 3}>
          <EventCard loading />
          <EventCard loading />
          <EventCard loading />
          <EventCard loading />
          <EventCard loading />
          <EventCard loading />
        </Card.Group>
      )}

      {!props.loading && (
        <Card.Group itemsPerRow={props.itemsPerRow ?? 3}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={navigateEventDetail}
            />
          ))}
        </Card.Group>
      )}
    </div>
  )
})
