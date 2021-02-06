import React from 'react'
import isEmail from 'validator/lib/isEmail'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import Italic from 'decentraland-gatsby/dist/components/Text/Italic'
import Link from 'decentraland-gatsby/dist/components/Text/Link'
import Avatar from 'decentraland-gatsby/dist/components/Profile/Avatar'
import DateBox from 'decentraland-gatsby/dist/components/Date/DateBox'
import { SessionEventAttributes } from '../../../../entities/Event/types'
import JumpInButton from '../../../Button/JumpInButton'
import EventSection from '../../EventSection'
import EventDateDetail from './EventDateDetail'

import './EventDetail.css'

const extra = require('../../../../images/info.svg')
const info = require('../../../../images/secondary-info.svg')
const pin = require('../../../../images/secondary-pin.svg')
const friends = require('../../../../images/secondary-friends.svg')

const ATTENDEES_PREVIEW_LIMIT = 12

export type EventDetailProps = {
  event: SessionEventAttributes
  showDescription?: boolean
  showDate?: boolean
  showAllDates?: boolean
  showCountdownDate?: boolean
  showPlace?: boolean
  showAttendees?: boolean
  showContact?: boolean
  showDetails?: boolean
  utc?: boolean
  onClickEdit?: (event: React.MouseEvent<HTMLButtonElement>, data: SessionEventAttributes) => void
  onClickAttendees?: (event: React.MouseEvent<HTMLDivElement>, data: SessionEventAttributes) => void
}

export default function EventDetail({ event, ...props }: EventDetailProps) {
  const now = Date.now()
  const { next_start_at } = event || { next_start_at: new Date(now) }
  const completed = event.finish_at.getTime() < now
  const dates = completed ? event.recurrent_dates : event.recurrent_dates.filter((date) => date.getTime() + event.duration > now)
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
    {event && event.rejected && <div className="EventNote EventNote--error"><code>This event was rejected</code></div>}
    {event && !event.rejected && !event.approved && <div className="EventNote"><code>This event is pending approval</code></div>}
    {event && <div className={'EventDetail'}>
      <div className="EventDetail__Header">
        <DateBox date={next_start_at} utc={props.utc} />
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
      {props.showDescription !== false && <EventSection maxHeight="500px">
        <EventSection.Icon src={info} width="16" height="16" />
        <EventSection.Detail >
          {!event.description && <Paragraph secondary={!event.description} >
            <Italic>No description</Italic>
          </Paragraph>}
          {event.description && <Markdown source={event.description} />}
        </EventSection.Detail>
        <EventSection.Action />
      </EventSection>}

      {/* DATE */}
      {props.showDate !== false && <EventSection.Divider />}
      {props.showDate !== false && props.showAllDates === false && <EventDateDetail event={event} startAt={next_start_at} utc={props.utc} countdown={!!props.showCountdownDate} />}
      {props.showDate !== false && props.showAllDates !== false && <div style={{ maxHeight: '500px', overflow: 'auto' }}>
        {dates.map((date, i) => {
          return <EventDateDetail
            key={date.getTime()}
            utc={props.utc}
            style={i > 0 ? { paddingTop: '0' } : {}}
            secondary={i > 0 || date.getTime() + event.duration < now}
            completed={date.getTime() + event.duration < now}
            event={event}
            startAt={date} />
        })}
      </div>}

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
          {(event.latest_attendees || []).slice(0, ATTENDEES_PREVIEW_LIMIT).map((address) => <Avatar key={address} size="small" address={address} />)}
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