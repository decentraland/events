import React from 'react';
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Bold from 'decentraland-gatsby/dist/components/Text/Bold'
import { toMonthName, toDayName, Time } from 'decentraland-gatsby/dist/components/Date/utils'
import useCountdown from 'decentraland-gatsby/dist/hooks/useCountdown'
import { SessionEventAttributes } from '../../../../entities/Event/types'
import AddToCalendarButton from '../../../Button/AddToCalendarButton'
import Live from '../../../Badge/Live'
import EventSection from '../../EventSection'

const clock = require('../../../../images/secondary-clock.svg')

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export type EventDateDetailProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes,
  startAt?: Date
  secondary?: boolean
  completed?: boolean
  countdown?: boolean
}

export default function EventDateDetail({ event, startAt, secondary, completed, countdown, ...props }: EventDateDetailProps) {
  const duration = event.duration
  const start_at = startAt || event.start_at;
  const finish_at = new Date(start_at.getTime() + duration)
  const time = useCountdown(start_at, Time.Second, true)
  const live = time.countingUp

  return <EventSection {...props}>
    <EventSection.Icon src={secondary ? '' : clock} width="16" height="16" />
    {live && <EventSection.Detail>
      {time.days > 1 && <Paragraph secondary={secondary}>Started: {time.days} days ago</Paragraph>}
      {time.days === 1 && <Paragraph secondary={secondary}>Started: {time.days} day ago</Paragraph>}
      {time.days === 0 && time.hours > 1 && <Paragraph secondary={secondary}>Started: {time.hours} hours ago</Paragraph>}
      {time.days === 0 && time.hours === 1 && <Paragraph secondary={secondary}>Started: {time.hours} hour ago</Paragraph>}
      {time.days === 0 && time.hours === 0 && time.minutes > 1 && <Paragraph secondary={secondary}>Started: {time.minutes} minutes ago</Paragraph>}
      {time.days === 0 && time.hours === 0 && time.minutes === 1 && <Paragraph secondary={secondary}>Started: {time.minutes} minute ago</Paragraph>}
      {time.days === 0 && time.hours === 0 && time.minutes === 0 && <Paragraph secondary={secondary}>Started: Less than a minute ago</Paragraph>}
    </EventSection.Detail>}
    {!live && countdown && <EventSection.Detail>
      {time.days > 1 && <Paragraph secondary={secondary}>Starts in: {time.days} days</Paragraph>}
      {time.days === 1 && <Paragraph secondary={secondary}>Starts in: {time.days} day</Paragraph>}
      {time.days === 0 && time.hours > 1 && <Paragraph secondary={secondary}>Starts in: {time.hours} hours</Paragraph>}
      {time.days === 0 && time.hours === 1 && <Paragraph secondary={secondary}>Starts in: {time.hours} hour</Paragraph>}
      {time.days === 0 && time.hours === 0 && time.minutes > 1 && <Paragraph secondary={secondary}>Starts in: {time.minutes} minutes</Paragraph>}
      {time.days === 0 && time.hours === 0 && time.minutes === 1 && <Paragraph secondary={secondary}>Starts in: {time.minutes} minute</Paragraph>}
      {time.days === 0 && time.hours === 0 && time.minutes === 0 && <Paragraph secondary={secondary}>Starts in: Less than a minute</Paragraph>}
    </EventSection.Detail>}
    {!live && !countdown && duration < DAY && <EventSection.Detail>
      <Paragraph secondary={secondary} >
        <Bold>
          {toDayName(start_at, { capitalized: true, utc: true })}
          {', '}
          {toMonthName(start_at, { short: true, capitalized: true, utc: true })}
          {' '}
          {start_at.getUTCDate()}
        </Bold>
        {duration === 0 && <>
          {' '}
          <Bold>
            {start_at.getUTCHours() % 12 || 12}
            {start_at.getUTCMinutes() > 0 && ':'}
            {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
            {start_at.getUTCHours() >= 12 ? 'pm' : 'am'}
          </Bold>
        </>}
        {duration > 0 && <>
          {' from '}
          <Bold>
            {start_at.getUTCHours() % 12 || 12}
            {start_at.getUTCMinutes() > 0 && ':'}
            {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
            {start_at.getUTCHours() >= 12 ? 'pm' : 'am'}
          </Bold>
          {' to '}
          <Bold>
            {finish_at.getUTCHours() % 12 || 12}
            {finish_at.getUTCMinutes() > 0 && ':'}
            {finish_at.getUTCMinutes() > 0 && finish_at.getUTCMinutes()}
            {finish_at.getUTCHours() >= 12 ? 'pm' : 'am'}
          </Bold>
        </>}
        {' UTC'}
      </Paragraph>
    </EventSection.Detail>}
    {!live && !countdown && duration >= DAY && event.all_day && <EventSection.Detail>
      <Paragraph secondary={secondary} >
        {'From '}
        <Bold>{toDayName(start_at, { capitalized: true, utc: true })}
          {', '}
          {start_at.getUTCDate()}
          {' '}
          {toMonthName(start_at, { short: true, capitalized: true, utc: true })}
        </Bold>
        {' to '}
        <Bold>
          {toDayName(finish_at, { capitalized: true, utc: true })}
          {', '}
          {finish_at.getUTCDate()}
          {' '}
          {toMonthName(finish_at, { short: true, capitalized: true, utc: true })}
        </Bold>
        {' UTC'}
      </Paragraph>
    </EventSection.Detail>}
    {!live && !countdown && duration >= DAY && !event.all_day && <EventSection.Detail>
      <Paragraph secondary={secondary} >
        <span style={{ width: '3.5em', display: 'inline-block' }}>{'From: '}</span>
        <Bold>{toDayName(start_at, { capitalized: true, utc: true })}
          {', '}
          {toMonthName(start_at, { short: true, capitalized: true, utc: true })}
          {' '}
          {start_at.getUTCDate()}
        </Bold>
        {' at '}
        <Bold>
          {start_at.getUTCHours() % 12 || 12}
          {start_at.getUTCMinutes() > 0 && ':'}
          {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
          {start_at.getUTCHours() >= 12 ? 'pm' : 'am'}
          {' UTC'}
        </Bold>
      </Paragraph>
      <Paragraph secondary={secondary} >
        <span style={{ width: '3.5em', display: 'inline-block' }}>{'To: '}</span>
        <Bold>
          {toDayName(finish_at, { capitalized: true, utc: true })}
          {', '}
          {toMonthName(finish_at, { short: true, capitalized: true, utc: true })}
          {' '}
          {finish_at.getUTCDate()}
        </Bold>
        {' at '}
        <Bold>
          {finish_at.getUTCHours() % 12 || 12}
          {finish_at.getUTCMinutes() > 0 && ':'}
          {finish_at.getUTCMinutes() > 0 && finish_at.getUTCMinutes()}
          {finish_at.getUTCHours() >= 12 ? 'pm' : 'am'}
          {' UTC'}
        </Bold>
      </Paragraph>
    </EventSection.Detail>}
    <EventSection.Action>
      {live && <Live primary />}
      {!live && !completed && <AddToCalendarButton event={event} startAt={start_at} style={secondary ? { opacity: .7 } : {}} />}
    </EventSection.Action>
  </EventSection>
}