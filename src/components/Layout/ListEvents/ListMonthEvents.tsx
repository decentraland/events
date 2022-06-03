import React from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { SessionEventAttributes } from "../../../entities/Event/types"
import EventCard from "../../Event/EventCard/EventCard"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { useProfileSettingsContext } from "../../../context/ProfileSetting"
import { navigateEventDetail } from "../../../modules/events"

export type ListMonthEventsProps = {
  events: SessionEventAttributes[]
  date: Date
  itemsPerRow?: 2 | 3
}

export const ListMonthEvents = React.memo((props: ListMonthEventsProps) => {
  const [settings] = useProfileSettingsContext()

  return (
    <div key={"month:" + props.date.toJSON()}>
      <div className="GroupTitle">
        <SubTitle>
          {Time.from(props.date, {
            utc: !settings?.use_local_time,
          }).format("MMMM")}
        </SubTitle>
      </div>
      <Card.Group itemsPerRow={props.itemsPerRow ?? 3}>
        {props.events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={navigateEventDetail}
          />
        ))}
      </Card.Group>
    </div>
  )
})
