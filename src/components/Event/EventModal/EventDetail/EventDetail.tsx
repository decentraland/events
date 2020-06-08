import React from 'react'
import isEmail from 'validator/lib/isEmail'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import Italic from 'decentraland-gatsby/dist/components/Text/Italic'
import Link from 'decentraland-gatsby/dist/components/Text/Link'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import DateBox from 'decentraland-gatsby/dist/components/Date/DateBox'
import Bold from 'decentraland-gatsby/dist/components/Text/Bold'
import { toMonthName, toDayName } from 'decentraland-gatsby/dist/components/Date/utils'
import { SessionEventAttributes } from '../../../../entities/Event/types'
import JumpInButton from '../../../Button/JumpInButton'
import AddToCalendarButton from '../../../Button/AddToCalendarButton'
import Live from '../../../Badge/Live'
import EventSection from '../../EventSection'

import './EventDetail.css'

const extra = require('../../../../images/info.svg')
const info = require('../../../../images/secondary-info.svg')
const clock = require('../../../../images/secondary-clock.svg')
const pin = require('../../../../images/secondary-pin.svg')
const friends = require('../../../../images/secondary-friends.svg')

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const ATTENDEES_PREVIEW_LIMIT = 12

export type EventDetailProps = {
  event: SessionEventAttributes
  showDescription?: boolean
  showDate?: boolean
  showPlace?: boolean
  showAttendees?: boolean
  showContact?: boolean
  showDetails?: boolean
  onClickEdit?: (event: React.MouseEvent<HTMLButtonElement>, data: SessionEventAttributes) => void
  onClickAttendees?: (event: React.MouseEvent<HTMLDivElement>, data: SessionEventAttributes) => void
}

export default function EventDetail({ event, ...props }: EventDetailProps) {
  const now = new Date()
  const { start_at, finish_at } = event || { start_at: now, finish_at: now }
  const duration = finish_at.getTime() - start_at.getTime()
  const live = now.getTime() >= start_at.getTime() && now.getTime() < finish_at.getTime()
  const liveSince = now.getTime() - start_at.getTime()
  const attendeesDiff = event.total_attendees - ATTENDEES_PREVIEW_LIMIT
  const advance = event.editable || event.owned

  function handleEdit(e: React.MouseEvent<HTMLButtonElement>) {
    if (props.onClickEdit) {
      props.onClickEdit(e, event)
    }
  }

  function handleAttendees(e: React.MouseEvent<HTMLDivElement>) {
    if (props.onClickAttendees) {
      props.onClickAttendees(e, event)
    }
  }

  return <>
    {event && event.rejected && <div className="EventError EventError--error"><code>This event was rejected</code></div>}
    {event && !event.rejected && !event.approved && <div className="EventNote"><code>This event is pending approval</code></div>}
    {event && <div className={'EventDetail'}>
      <div className="EventDetail__Header">
        <DateBox date={start_at} />
        <div className="EventDetail__Header__Event">
          <SubTitle>{event.name}</SubTitle>
          <Paragraph className="EventDetail__Header__Event__By" secondary>Public, Organized by <Link>{event.user_name || 'Guest'}</Link></Paragraph>
        </div>
        {advance && <div className="EventDetail__Header__Actions">
          {props.onClickEdit && <Button basic onClick={handleEdit}> EDIT </Button>}
        </div>}
      </div>

      {/* DESCRIPTION */}
      {props.showDescription !== false && <EventSection.Divider />}
      {props.showDescription !== false && <EventSection>
        <EventSection.Icon src={info} width="16" height="16" />
        <EventSection.Detail>
          {!event.description && <Paragraph secondary={!event.description} >
            <Italic>No description</Italic>
          </Paragraph>}
          {event.description && <Markdown source={event.description} />}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>}

      {/* DATE */}
      {props.showDate !== false && <EventSection.Divider />}
      {props.showDate !== false && <EventSection>
        <EventSection.Icon src={clock} width="16" height="16" />
        {live && <EventSection.Detail>
          {liveSince < MINUTE && <Paragraph>Started: Less than a minute ago</Paragraph>}
          {liveSince > MINUTE && liveSince <= MINUTE * 2 && <Paragraph>Started: {Math.floor(liveSince / MINUTE)} minute ago</Paragraph>}
          {liveSince > MINUTE * 2 && liveSince <= HOUR && <Paragraph>Started: {Math.floor(liveSince / MINUTE)} minutes ago</Paragraph>}
          {liveSince > HOUR && liveSince <= HOUR * 2 && <Paragraph>Started: {Math.floor(liveSince / HOUR)} hour ago</Paragraph>}
          {liveSince > HOUR * 2 && liveSince <= DAY && <Paragraph>Started: {Math.floor(liveSince / HOUR)} hours ago</Paragraph>}
          {liveSince > DAY && liveSince <= DAY * 2 && <Paragraph>Started: {Math.floor(liveSince / DAY)} day ago</Paragraph>}
          {liveSince > DAY * 2 && <Paragraph>Started: {Math.floor(liveSince / DAY)} days ago</Paragraph>}
        </EventSection.Detail>}
        {!live && duration < DAY && <EventSection.Detail>
          <Paragraph >
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
          <Paragraph >
            {'From '}
            <Bold>{toDayName(start_at, { capitalized: true, utc: true })}
              {', '}
              {toMonthName(start_at, { short: true, capitalized: true, utc: true })}
              {' '}
              {start_at.getUTCDate()}
            </Bold>
            {' to '}
            <Bold>
              {toDayName(finish_at, { capitalized: true, utc: true })}
              {', '}
              {toMonthName(finish_at, { short: true, capitalized: true, utc: true })}
              {' '}
              {finish_at.getUTCDate()}
            </Bold>
            {' UTC'}
          </Paragraph>
        </EventSection.Detail>}
        {!live && duration >= DAY && !event.all_day && <EventSection.Detail>
          <Paragraph >
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
          <Paragraph >
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
          {!live && <AddToCalendarButton event={event} />}
          {live && <Live primary />}
        </EventSection.Action>
      </EventSection>}

      {/* PLACE */}
      {props.showPlace !== false && <EventSection.Divider />}
      {props.showPlace !== false && <EventSection>
        <EventSection.Icon src={pin} width="16" height="16" />
        <EventSection.Detail>
          <Paragraph bold>
            {event.scene_name || 'Decentraland'}
          </Paragraph>
        </EventSection.Detail>
        <EventSection.Action>
          <JumpInButton event={event} />
        </EventSection.Action>
      </EventSection>}

      {/* ATTENDEES */}
      {props.showAttendees !== false && <EventSection.Divider />}
      {props.showAttendees !== false && <EventSection>
        <EventSection.Icon src={friends} width="16x" height="16" center />
        <EventSection.Detail style={{ display: 'flex', justifyContent: attendeesDiff > 0 ? 'space-around' : '' }}>
          {(event.latest_attendees || []).slice(0, ATTENDEES_PREVIEW_LIMIT).map((address) => <ImgAvatar key={address} size="small" address={address} src={`${EVENTS_URL}/profile/${address.toString()}/face.png`} />)}
          {event.total_attendees === 0 && <Paragraph secondary><Italic>Nobody confirmed yet</Italic></Paragraph>}
        </EventSection.Detail>
        <EventSection.Action>
          {attendeesDiff > 0 && <div className="EventDetail__Detail__ShowAttendees" onClick={handleAttendees}>
            {`+${attendeesDiff}`}
          </div>}
        </EventSection.Action>
      </EventSection>}

      {/* CONTACT */}
      {props.showContact !== false && !event.approved && advance && <EventSection.Divider />}
      {props.showContact !== false && !event.approved && advance && <EventSection highlight>
        <EventSection.Icon src={extra} width="16" height="16" />
        <EventSection.Detail>
          {event.contact && !isEmail(event.contact) && <Paragraph>{event.contact}</Paragraph>}
          {event.contact && isEmail(event.contact) && <Paragraph>
            <Link href={'mailto:' + event.contact} target="_blank">{event.contact}</Link>
          </Paragraph>}
          {!event.contact && <Paragraph secondary={!event.contact} >
            <Italic>No contact</Italic>
          </Paragraph>}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>}

      {/* DETAILS */}
      {props.showContact !== false && !event.approved && advance && <EventSection.Divider />}
      {props.showContact !== false && !event.approved && advance && <EventSection highlight>
        <EventSection.Icon src={extra} width="16" height="16" />
        <EventSection.Detail>
          {event.details && <Paragraph>{event.details}</Paragraph>}
          {!event.details && <Paragraph secondary={!event.details} >
            <Italic>No details</Italic>
          </Paragraph>}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>}
    </div>
    }
  </>
}