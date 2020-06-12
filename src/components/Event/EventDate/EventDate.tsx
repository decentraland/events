import React from 'react';
import { toMonthName } from 'decentraland-gatsby/dist/components/Date/utils'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { SessionEventAttributes } from '../../../entities/Event/types'

import './EventDate.css'
import { start } from 'repl';

export type EventDateProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes
}

export default function EventDate(props: EventDateProps) {
  const startAt = props.event.start_at
  const startDay = new Date(props.event.start_at)
  startDay.setUTCHours(0)
  startDay.setUTCMinutes(0)
  startDay.setUTCSeconds(0)
  startDay.setUTCMilliseconds(0)
  const previousStartDay = new Date(startDay.getTime())
  previousStartDay.setUTCDate(previousStartDay.getUTCDate() - 1)
  const finishAt = new Date(props.event.start_at.getTime() + props.event.duration)
  const currentTime = Date.now()

  const isNow = currentTime >= startAt.getTime() && currentTime < finishAt.getTime()
  const isToday = currentTime < startAt.getTime() && currentTime > startDay.getTime()
  const isTomorrow = currentTime < startDay.getTime() && currentTime > previousStartDay.getTime()
  const date = toMonthName(startAt, { utc: true }) + ' ' + startAt.getUTCDate()
  return <div {...props} className={TokenList.join(['EventDate', props.className])}>
    {isNow && 'NOW'}
    {isToday && 'TODAY'}
    {isTomorrow && 'TOMORROW'}
    {!isNow && !isToday && !isTomorrow && date}
  </div>
}