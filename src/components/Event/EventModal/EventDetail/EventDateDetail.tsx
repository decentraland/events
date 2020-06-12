import React, { CSSProperties } from 'react';
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Bold from 'decentraland-gatsby/dist/components/Text/Bold'
import { toMonthName, toDayName } from 'decentraland-gatsby/dist/components/Date/utils'
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
}

export default function EventDateDetail({ event, startAt, secondary, ...props }: EventDateDetailProps) {

  const now = Date.now()
  const duration = event.duration
  const start_at = startAt || event.start_at;
  const finish_at = new Date(start_at.getTime() + duration)
  const live = now >= start_at.getTime() && now < (start_at.getTime() + event.duration)
  const liveSince = now - start_at.getTime()

  return <EventSection {...props} style={secondary ? { paddingTop: '0' } : {}}>
    <EventSection.Icon src={secondary ? '' : clock} width="16" height="16" />
    {live && <EventSection.Detail>
      {liveSince < MINUTE && <Paragraph secondary={secondary}>Started: Less than a minute ago</Paragraph>}
      {liveSince > MINUTE && liveSince <= MINUTE * 2 && <Paragraph secondary={secondary}>Started: {Math.floor(liveSince / MINUTE)} minute ago</Paragraph>}
      {liveSince > MINUTE * 2 && liveSince <= HOUR && <Paragraph secondary={secondary}>Started: {Math.floor(liveSince / MINUTE)} minutes ago</Paragraph>}
      {liveSince > HOUR && liveSince <= HOUR * 2 && <Paragraph secondary={secondary}>Started: {Math.floor(liveSince / HOUR)} hour ago</Paragraph>}
      {liveSince > HOUR * 2 && liveSince <= DAY && <Paragraph secondary={secondary}>Started: {Math.floor(liveSince / HOUR)} hours ago</Paragraph>}
      {liveSince > DAY && liveSince <= DAY * 2 && <Paragraph secondary={secondary}>Started: {Math.floor(liveSince / DAY)} day ago</Paragraph>}
      {liveSince > DAY * 2 && <Paragraph secondary={secondary}>Started: {Math.floor(liveSince / DAY)} days ago</Paragraph>}
    </EventSection.Detail>}
    {!live && duration < DAY && <EventSection.Detail>
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
    {!live && duration >= DAY && event.all_day && <EventSection.Detail>
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
    {!live && duration >= DAY && !event.all_day && <EventSection.Detail>
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
      {!live && <AddToCalendarButton event={event} startAt={start_at} style={secondary ? { opacity: .7 } : {}} />}
    </EventSection.Action>
  </EventSection>
}