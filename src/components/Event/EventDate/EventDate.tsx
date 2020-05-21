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
  startDay.setHours(0)
  startDay.setMinutes(0)
  startDay.setSeconds(0)
  startDay.setMilliseconds(0)
  const finishAt = props.event.finish_at
  const currentTime = Date.now()

  const isNow = currentTime >= startAt.getTime() && currentTime < finishAt.getTime()
  const isToday = currentTime < startAt.getTime() && currentTime > startDay.getTime()
  const date = toMonthName(startAt, { utc: true }) + ' ' + startAt.getUTCDate()
  return <div {...props} className={TokenList.join(['EventDate', props.className])}>
    {isNow && 'NOW'}
    {isToday && 'TODAY'}
    {!isNow && !isToday && date}
  </div>
}