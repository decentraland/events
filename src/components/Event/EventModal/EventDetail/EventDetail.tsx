import React from 'react'
import isEmail from 'validator/lib/isEmail'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import Italic from 'decentraland-gatsby/dist/components/Text/Italic'
import Link from 'decentraland-gatsby/dist/components/Text/Link'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import DateBox from 'decentraland-gatsby/dist/components/Date/DateBox'
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

const DAY = 1000 * 60 * 60 * 24
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const ATTENDEES_PREVIEW_LIMIT = 12

export type EventDetailProps = {
  event: SessionEventAttributes
  onClickEdit?: (event: React.MouseEvent<HTMLButtonElement>, data: SessionEventAttributes) => void
  onClickAttendees?: (event: React.MouseEvent<HTMLDivElement>, data: SessionEventAttributes) => void
}

export default function EventDetail({ event, ...props }: EventDetailProps) {
  const now = new Date()
  const { start_at, finish_at } = event || { start_at: now, finish_at: now }
  const duration = finish_at.getTime() - start_at.getTime()
  const live = now.getTime() >= start_at.getTime() && now.getTime() < finish_at.getTime()
  const position = `${event.x},${event.y}`
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
    {event && <ImgFixed src={event.image || ''} dimension="wide" />}
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
      <EventSection.Divider />
      <EventSection>
        <EventSection.Icon src={info} width="16" height="16" />
        <EventSection.Detail>
          {!event.description && <Paragraph secondary={!event.description} >
            <Italic>No description</Italic>
          </Paragraph>}
          {event.description && <Markdown source={event.description} />}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>

      {/* DATE */}
      <EventSection.Divider />
      <EventSection>
        <EventSection.Icon src={clock} width="16" height="16" />
        {duration < DAY && <EventSection.Detail>
          <Paragraph >
            {toDayName(start_at, { capitalized: true, utc: true })}
            {', '}
            {toMonthName(start_at, { short: true, capitalized: true, utc: true })}
            {' '}
            {start_at.getUTCDate()}
            {duration === 0 && <>
              {' '}
              {start_at.getUTCHours() % 12 || 12}
              {start_at.getUTCMinutes() > 0 && ':'}
              {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
              {start_at.getUTCHours() >= 12 ? 'pm' : 'am'}
            </>}
            {duration > 0 && <>
              {' from '}
              {start_at.getUTCHours() % 12 || 12}
              {start_at.getUTCMinutes() > 0 && ':'}
              {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
              {start_at.getUTCHours() >= 12 ? 'pm' : 'am'}
              {' to '}
              {finish_at.getUTCHours() % 12 || 12}
              {finish_at.getUTCMinutes() > 0 && ':'}
              {finish_at.getUTCMinutes() > 0 && finish_at.getUTCMinutes()}
              {finish_at.getUTCHours() >= 12 ? 'pm' : 'am'}
            </>}
            {' UTC'}
          </Paragraph>
        </EventSection.Detail>}
        {duration >= DAY && <EventSection.Detail>
          <Paragraph >
            <code>{'FROM: '}</code>
            {toDayName(start_at, { capitalized: true, utc: true })}
            {', '}
            {toMonthName(start_at, { short: true, capitalized: true, utc: true })}
            {' '}
            {start_at.getUTCDate()}
            {' '}
            {start_at.getUTCHours() % 12 || 12}
            {start_at.getUTCMinutes() > 0 && ':'}
            {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
            {start_at.getUTCHours() >= 12 ? 'pm' : 'am'}
            {' UTC'}
          </Paragraph>
          <Paragraph >
            <code>{'  TO: '}</code>
            {toDayName(finish_at, { capitalized: true })}
            {', '}
            {toMonthName(finish_at, { short: true, capitalized: true })}
            {' '}
            {finish_at.getUTCDate()}
            {' '}
            {finish_at.getUTCHours() % 12 || 12}
            {finish_at.getUTCMinutes() > 0 && ':'}
            {finish_at.getUTCMinutes() > 0 && finish_at.getUTCMinutes()}
            {finish_at.getUTCHours() >= 12 ? 'pm' : 'am'}
            {' UTC'}
          </Paragraph>
        </EventSection.Detail>}
        <EventSection.Action>
          {!live && <AddToCalendarButton event={event} />}
          {live && <Live primary />}
        </EventSection.Action>
      </EventSection>

      {/* PLACE */}
      <EventSection.Divider />
      <EventSection>
        <EventSection.Icon src={pin} width="16" height="16" />
        <EventSection.Detail>

          <Paragraph>
            {event.scene_name || 'Decentraland'}
            {position !== '0,0' && ` (${position})`}
          </Paragraph>
        </EventSection.Detail>
        <EventSection.Action>
          <JumpInButton event={event} />
        </EventSection.Action>
      </EventSection>

      {/* ATTENDEES */}
      <EventSection.Divider />
      <EventSection>
        <EventSection.Icon src={friends} width="16x" height="16" center />
        <EventSection.Detail>
          {(event.latest_attendees || []).slice(0, ATTENDEES_PREVIEW_LIMIT).map((address) => <ImgAvatar key={address} size="small" address={address} src={`${EVENTS_URL}/profile/${address.toString()}/face.png`} />)}
          {event.total_attendees === 0 && <Paragraph secondary><Italic>Nobody confirmed yet</Italic></Paragraph>}
          {attendeesDiff > 0 && <div className={TokenList.join([
            "EventDetail__Detail__ShowAttendees",
            attendeesDiff >= 10 && 'MoreThan10',
            attendeesDiff >= 100 && 'MoreThan100',
            attendeesDiff >= 1000 && 'MoreThan1000',
          ])} onClick={handleAttendees}>
            {`+${attendeesDiff}`}
          </div>}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>

      {/* CONTACT */}
      {event.approved && advance && <EventSection.Divider />}
      {event.approved && advance && <EventSection highlight>
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
      {event.approved && advance && <EventSection.Divider />}
      {event.approved && advance && <EventSection highlight>
        <EventSection.Icon src={extra} width="16" height="16" />
        <EventSection.Detail>
          {event.details && <Paragraph>{event.details}</Paragraph>}
          {!event.details && <Paragraph secondary={!event.details} >
            <Italic>No details</Italic>
          </Paragraph>}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>}
    </div>}
  </>
}