import React from 'react';
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import Datetime from 'decentraland-gatsby/dist/utils/Datetime';
import { SessionEventAttributes } from '../../../entities/Event/types'
import './EventDate.css'

export type EventDateProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes
  utc?: boolean
}

export default function EventDate(props: EventDateProps) {

  const currentTime = Date.now()
  const options = { utc: props.utc }
  const duration = props.event.duration || (1000 * 60 * 60)
  const startAt = Datetime.from(props.event.next_start_at || new Date(currentTime), options)
  const finishAt = Datetime.from(startAt.getTime() + duration, options)
  const startDay = Datetime.from(startAt.getTime(), options)
  startDay.setHours(0, 0, 0, 0)
  const previousStartDay = Datetime.from(startDay.getTime(), options)
  previousStartDay.setDate(previousStartDay.getDate() - 1)

  const isNow = currentTime >= startAt.getTime() && currentTime < finishAt.getTime()
  const isToday = currentTime < startAt.getTime() && currentTime > startDay.getTime()
  const isTomorrow = currentTime < startDay.getTime() && currentTime > previousStartDay.getTime()
  const date = startAt.getMonthName() + ' ' + startAt.getDatePadded()
  return <div {...props} className={TokenList.join(['EventDate', props.className])}>
    {isNow && 'NOW'}
    {isToday && 'TODAY'}
    {isTomorrow && 'TOMORROW'}
    {!isNow && !isToday && !isTomorrow && date}
  </div>
}