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

  const currentTime = Date.now()
  const { next_start_at, duration } = props.event || { next_start_at: new Date(currentTime) }
  const startDay = new Date(props.event.start_at)
  startDay.setUTCHours(0)
  startDay.setUTCMinutes(0)
  startDay.setUTCSeconds(0)
  startDay.setUTCMilliseconds(0)
  const previousStartDay = new Date(startDay.getTime())
  previousStartDay.setUTCDate(previousStartDay.getUTCDate() - 1)
  const finishAt = new Date(next_start_at.getTime() + duration)

  const isNow = currentTime >= next_start_at.getTime() && currentTime < finishAt.getTime()
  const isToday = currentTime < next_start_at.getTime() && currentTime > startDay.getTime()
  const isTomorrow = currentTime < startDay.getTime() && currentTime > previousStartDay.getTime()
  const date = toMonthName(next_start_at, { utc: true }) + ' ' + next_start_at.getUTCDate()
  return <div {...props} className={TokenList.join(['EventDate', props.className])}>
    {isNow && 'NOW'}
    {isToday && 'TODAY'}
    {isTomorrow && 'TOMORROW'}
    {!isNow && !isToday && !isTomorrow && date}
  </div>
}