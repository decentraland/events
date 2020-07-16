import React from 'react';
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Bold from 'decentraland-gatsby/dist/components/Text/Bold'
import Datetime from 'decentraland-gatsby/dist/utils/Datetime'
import useCountdown from 'decentraland-gatsby/dist/hooks/useCountdown'
import { SessionEventAttributes } from '../../../../entities/Event/types'
import AddToCalendarButton from '../../../Button/AddToCalendarButton'
import Live from '../../../Badge/Live'
import EventSection from '../../EventSection'

const clock = require('../../../../images/secondary-clock.svg')

export type EventDateDetailProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes,
  startAt?: Date
  secondary?: boolean
  completed?: boolean
  countdown?: boolean
  utc?: boolean
}

export default function EventDateDetail({ event, startAt, secondary, completed, countdown, utc, ...props }: EventDateDetailProps) {
  const duration = event.duration
  const start_at = Datetime.from(startAt || event.start_at, { utc })
  const finish_at = Datetime.from(start_at.getTime() + duration, { utc })
  const time = useCountdown(start_at.date, Datetime.Second, true)
  const live = time.countingUp
  const capitalized = true
  const short = true

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
    {!live && !countdown && duration < Datetime.Day && <EventSection.Detail>
      <Paragraph secondary={secondary} >
        <Bold>
          {start_at.getDayName({ capitalized })}
          {', '}
          {start_at.getMonthName({ capitalized, short })}
          {' '}
          {start_at.getDatePadded()}
        </Bold>
        {duration === 0 && <>
          {' '}
          <Bold>
            {start_at.getHours() % 12 || 12}
            {start_at.getMinutes() > 0 && ':'}
            {start_at.getMinutes() > 0 && start_at.getMinutes()}
            {start_at.getHours() >= 12 ? 'pm' : 'am'}
          </Bold>
        </>}
        {duration > 0 && <>
          {' from '}
          <Bold>
            {start_at.getHours() % 12 || 12}
            {start_at.getMinutes() > 0 && ':'}
            {start_at.getMinutes() > 0 && start_at.getMinutes()}
            {start_at.getHours() >= 12 ? 'pm' : 'am'}
          </Bold>
          {' to '}
          <Bold>
            {finish_at.getHours() % 12 || 12}
            {finish_at.getMinutes() > 0 && ':'}
            {finish_at.getMinutes() > 0 && finish_at.getMinutes()}
            {finish_at.getHours() >= 12 ? 'pm' : 'am'}
          </Bold>
        </>}
        {' '}
        {finish_at.getTimezoneName()}
      </Paragraph>
    </EventSection.Detail>}
    {!live && !countdown && duration >= Datetime.Day && event.all_day && <EventSection.Detail>
      <Paragraph secondary={secondary} >
        {'From '}
        <Bold>
          {start_at.getDayName({ capitalized })}
          {', '}
          {start_at.getDate()}
          {' '}
          {start_at.getMonthName({ capitalized, short })}
        </Bold>
        {' to '}
        <Bold>
          {finish_at.getDayName({ capitalized })}
          {', '}
          {finish_at.getDate()}
          {' '}
          {finish_at.getMonthName({ capitalized, short })}
        </Bold>
        {' '}
        {finish_at.getTimezoneName()}
      </Paragraph>
    </EventSection.Detail>}
    {!live && !countdown && duration >= Datetime.Day && !event.all_day && <EventSection.Detail>
      <Paragraph secondary={secondary} >
        <span style={{ width: '3.5em', display: 'inline-block' }}>{'From: '}</span>
        <Bold>
          {start_at.getDayName({ capitalized })}
          {', '}
          {start_at.getMonthName({ capitalized, short })}
          {' '}
          {start_at.getDate()}
        </Bold>
        {' at '}
        <Bold>
          {start_at.getHours() % 12 || 12}
          {start_at.getMinutes() > 0 && ':'}
          {start_at.getMinutes() > 0 && start_at.getMinutes()}
          {start_at.getHours() >= 12 ? 'pm' : 'am'}
        </Bold>
        {' '}
        {start_at.getTimezoneName()}
      </Paragraph>
      <Paragraph secondary={secondary} >
        <span style={{ width: '3.5em', display: 'inline-block' }}>{'To: '}</span>
        <Bold>
          {finish_at.getDayName({ capitalized })}
          {', '}
          {finish_at.getMonthName({ capitalized, short })}
          {' '}
          {finish_at.getDate()}
        </Bold>
        {' at '}
        <Bold>
          {finish_at.getHours() % 12 || 12}
          {finish_at.getMinutes() > 0 && ':'}
          {finish_at.getMinutes() > 0 && finish_at.getMinutes()}
          {finish_at.getHours() >= 12 ? 'pm' : 'am'}
        </Bold>
        {' '}
        {finish_at.getTimezoneName()}
      </Paragraph>
    </EventSection.Detail>}
    <EventSection.Action>
      {live && <Live primary />}
      {!live && !completed && <AddToCalendarButton event={event} startAt={start_at.date} style={secondary ? { opacity: .7 } : {}} />}
    </EventSection.Action>
  </EventSection>
}