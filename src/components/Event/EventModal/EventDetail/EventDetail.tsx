import React from 'react'
import { navigate } from 'gatsby'
import { EventAttributes } from '../../../../entities/Event/types'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import { toMonthName, toDayName, toInputDate, toInputTime } from '../../../Date/utils'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Divider from 'decentraland-gatsby/dist/components/Text/Divider'
import Italic from 'decentraland-gatsby/dist/components/Text/Italic'
import Link from 'decentraland-gatsby/dist/components/Text/Link'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import AttendingButtons from '../../../Button/AttendingButtons'
import EditButtons from '../../../Button/EditButtons'
import JumpInButton from '../../../Button/JumpInButton'
import AddToCalendarButton from '../../../Button/AddToCalendarButton'
import DateBox from '../../../Date/DateBox'
import { useLocation } from '@reach/router'

const extra = require('../../../../images/info.svg')
const info = require('../../../../images/secondary-info.svg')
const clock = require('../../../../images/secondary-clock.svg')
const pin = require('../../../../images/secondary-pin.svg')
const friends = require('../../../../images/secondary-friends.svg')

import './EventDetail.css'
import url from '../../../../url'
import classname from 'decentraland-gatsby/dist/utils/classname'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import isEmail from 'validator/lib/isEmail'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import useEventEditor from '../../../../hooks/useEventEditor'

const DAY = 1000 * 60 * 60 * 24
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 10

export type EventDetailProps = {
  event: EventAttributes,
  edit?: boolean
}

export default function EventDetail({ event, ...props }: EventDetailProps) {
  const now = new Date()
  const { start_at, finish_at } = event || { start_at: now, finish_at: now }
  const duration = finish_at.getTime() - start_at.getTime()
  const position = (event?.coordinates || [0, 0]).join()
  const attendeesDiff = event.total_attendees - EVENTS_LIST
  const location = useLocation()
  const [profile] = useProfile()
  const editable = (event as any).editable
  const owner = event.user.toLowerCase() === profile?.address.toString().toLowerCase()
  const canSeeDetails = editable || owner
  const edit = editable && props.edit
  const editDetails = owner && props.edit

  const [edited, actions] = useEventEditor({
    name: event.name,
    description: event.description,
    coordinates: event.coordinates,
    start_at: event.start_at,
    finish_at: event.finish_at,
    image: event.image,
  })

  const errors = Object.keys(edited.errors)

  function handleCancel() {
    actions.setValues({
      name: event.name,
      description: event.description,
      coordinates: event.coordinates,
      start_at: event.start_at,
      finish_at: event.finish_at,
      image: event.image,
    })

    navigate(url.toEvent(location, event.id))
  }

  function handleEdit() {
    navigate(url.toEventEdit(location, event.id))
  }

  function handleSave() {
    navigate(url.toEvent(location, event.id))
  }

  return <>
    {/* {event && <>} */}
    {event && <ImgFixed src={edited.image} dimension="wide" />}
    {event && edit && <div className="EventInput"><code><input name="image" value={edited.image || ''} onChange={actions.handleChange} /></code></div>}
    {event && !edit && event.rejected && <div className="EventError"><code>This event was rejected</code></div>}
    {event && !edit && !event.rejected && !event.approved && <div className="EventNote"><code>This event is pending approval</code></div>}
    {event && <div className={'EventDetail'}>
      <div className="EventDetail__Header">
        <DateBox date={start_at} />
        <div className="EventDetail__Header__Event">
          {edit && <input name="name" placeholder="Event name" value={edited.name} onChange={actions.handleChange} />}
          {!edit && <SubTitle>{event.name}</SubTitle>}
          <Paragraph secondary>Public, Organized by <Link>{event.user_name || 'Guest'}</Link></Paragraph>
        </div>
        {editable && <div className="EventDetail__Header__Action">
          {edit && <Button basic onClick={handleCancel}> CANCEL </Button>}
          {!edit && <Button basic onClick={handleEdit}> EDIT </Button>}
        </div>}
      </div>

      {/* DESCRIPTION */}
      <Divider line />
      <div className={classname(['EventDetail__Detail', edit && 'EventDetail__Detail--edit'])}>
        <div className="EventDetail__Detail__Icon">
          <img src={info} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          {edit && <textarea name="description" placeholder="Event description" value={edited.description} rows={10} onChange={actions.handleChange} />}
          {!edit && event.description && <Paragraph>{event.description}</Paragraph>}
          {!edit && !event.description && <Paragraph secondary={!event.description} >
            <Italic>No description</Italic>
          </Paragraph>}
        </div>
        <div className="EventDetail__Detail__Action"></div>
      </div>

      {/* DATE */}
      <Divider line />
      <div className={classname(['EventDetail__Detail', edit && 'EventDetail__Detail--edit'])}>
        <div className="EventDetail__Detail__Icon">
          <img src={clock} width="16" height="16" />
        </div>
        {edit && <div className="EventDetail__Detail__Item">
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '.5em' }}>
            <code>{'FROM: '}</code>
            <input type="date" name="start_date" value={actions.getStartDate()} onChange={actions.handleChange} style={{ width: '200px' }} />
            <input type="time" name="finish_time" value={actions.getFinishTime()} onChange={actions.handleChange} style={{ width: '125px' }} />
            <code>{' UTC'}</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '.5em' }}>
            <code>{'  TO: '}</code>
            <input type="date" name="finish_date" value={actions.getFinishDate()} onChange={actions.handleChange} style={{ width: '200px' }} />
            <input type="time" name="finish_time" value={actions.getFinishTime()} onChange={actions.handleChange} style={{ width: '125px' }} />
            <code>{' UTC'}</code>
          </div>
        </div>}
        {!edit && duration < DAY && <div className="EventDetail__Detail__Item">
          <Paragraph >
            {toDayName(start_at, { capitalized: true, utc: true })}
            {', '}
            {toMonthName(start_at, { capitalized: true, utc: true })}
            {' '}
            {start_at.getUTCDate()}
            {duration === 0 && <>
              {' '}
              {start_at.getUTCHours()}
              {start_at.getUTCMinutes() > 0 && ':'}
              {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
              {start_at.getUTCHours() > 12 ? 'pm' : 'am'}
            </>}
            {duration > 0 && <>
              {' from '}
              {start_at.getUTCHours()}
              {start_at.getUTCMinutes() > 0 && ':'}
              {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
              {start_at.getUTCHours() > 12 ? 'pm' : 'am'}
              {' to '}
              {finish_at.getUTCHours()}
              {finish_at.getUTCMinutes() > 0 && ':'}
              {finish_at.getUTCMinutes() > 0 && finish_at.getUTCMinutes()}
              {finish_at.getUTCHours() > 12 ? 'pm' : 'am'}
            </>}
            {' UTC'}
          </Paragraph>
        </div>}
        {!edit && duration >= DAY && <div className="EventDetail__Detail__Item">
          <Paragraph >
            <code>{'FROM: '}</code>
            {toDayName(start_at, { capitalized: true, utc: true })}
            {', '}
            {toMonthName(start_at, { capitalized: true, utc: true })}
            {' '}
            {start_at.getUTCDate()}
            {' '}
            {start_at.getUTCHours()}
            {start_at.getUTCMinutes() > 0 && ':'}
            {start_at.getUTCMinutes() > 0 && start_at.getUTCMinutes()}
            {start_at.getUTCHours() > 12 ? 'pm' : 'am'}
            {' UTC'}
          </Paragraph>
          <Paragraph >
            <code>{'  TO: '}</code>
            {toDayName(finish_at, { capitalized: true })}
            {', '}
            {toMonthName(finish_at, { capitalized: true })}
            {' '}
            {finish_at.getUTCDate()}
            {' '}
            {finish_at.getUTCHours()}
            {finish_at.getUTCMinutes() > 0 && ':'}
            {finish_at.getUTCMinutes() > 0 && finish_at.getUTCMinutes()}
            {finish_at.getUTCHours() > 12 ? 'pm' : 'am'}
            {' UTC'}
          </Paragraph>
        </div>}
        {!edit && <div className="EventDetail__Detail__Action">
          <AddToCalendarButton event={event} />
        </div>}
      </div>

      {/* PLACE */}
      <Divider line />
      <div className={classname(['EventDetail__Detail', edit && 'EventDetail__Detail--edit'])}>
        <div className="EventDetail__Detail__Icon">
          <img src={pin} width="16" height="16" />
        </div>
        {edit && <div className="EventDetail__Detail__Item">
          <code>{'POSITION: '}</code>
          <input name="coordinates" value={(edited.coordinates || []).join(',')} onChange={actions.handleChange} style={{ width: '125px' }} />
        </div>}
        {!edit && <div className="EventDetail__Detail__Item">
          <Paragraph>
            {event.scene_name || 'Decentraland'}
            {position !== '0,0' && ` (${position})`}
          </Paragraph>
        </div>}
        {!edit && <div className="EventDetail__Detail__Action">
          <JumpInButton size="small" event={event} />
        </div>}
      </div>

      {/* ATTENDEES */}
      <Divider line />
      <div className="EventDetail__Detail">
        <div className={classname(['EventDetail__Detail__Icon', event.total_attendees > 0 && 'center'])}>
          <img src={friends} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          {(event.latest_attendees || []).slice(0, EVENTS_LIST).map((address) => <ImgAvatar key={address} size="small" address={address} src={`${EVENTS_URL}/profile/${address.toString()}/face.png`} />)}
          {event.total_attendees === 0 && <Paragraph secondary><Italic>Nobody confirmed yet</Italic></Paragraph>}
          {attendeesDiff > 0 && <div className={classname([
            "EventDetail__Detail__ShowAttendees",
            attendeesDiff >= 10 && 'MoreThan10',
            attendeesDiff >= 100 && 'MoreThan100',
            attendeesDiff >= 1000 && 'MoreThan1000',
          ])} onClick={() => navigate(url.toEventAttendees(location, event.id))}>
            {`+${attendeesDiff}`}
          </div>}
        </div>
        <div className="EventDetail__Detail__Action" />
      </div>

      {/* CONTACT */}
      {!event.approved && canSeeDetails && <Divider line />}
      {!event.approved && canSeeDetails && <div className={classname(['EventDetail__Detail', 'extra', edit && 'EventDetail__Detail--edit'])}>
        <div className="EventDetail__Detail__Icon">
          <img src={extra} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          {editDetails && <input name="contact" placeholder="Contact" value={edited.details} onChange={actions.handleChange} />}
          {!editDetails && event.contact && !isEmail(event.contact) && <Paragraph>{event.contact}</Paragraph>}
          {!editDetails && event.contact && isEmail(event.contact) && <Paragraph>
            <Link href={'mailto:' + event.contact} target="_blank">{event.contact}</Link>
          </Paragraph>}
          {!editDetails && !event.contact && <Paragraph secondary={!event.contact} >
            <Italic>No contact</Italic>
          </Paragraph>}
        </div>
        <div className="EventDetail__Detail__Action"></div>
      </div>}

      {/* DETAILS */}
      {!event.approved && canSeeDetails && <Divider line />}
      {!event.approved && canSeeDetails && <div className={classname(['EventDetail__Detail', 'extra', edit && 'EventDetail__Detail--edit'])}>
        <div className="EventDetail__Detail__Icon">
          <img src={extra} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          {editDetails && <textarea name="details" placeholder="Event details" value={edited.details} rows={10} onChange={actions.handleChange} />}
          {!editDetails && event.details && <Paragraph>{event.details}</Paragraph>}
          {!editDetails && !event.details && <Paragraph secondary={!event.details} >
            <Italic>No details</Italic>
          </Paragraph>}
        </div>
        <div className="EventDetail__Detail__Action"></div>
      </div>}

      {/* SOCIAL */}
      <Divider line />
      <div className="EventDetail__Actions">
        {!edit && event.approved && <AttendingButtons event={event} onShareFallback={() => navigate(url.toEventShare(location, event.id))} />}
        {!edit && !event.approved && <EditButtons event={event} />}
        {!!edit && <EditButtons event={event} onSave={handleSave} />}
      </div>
    </div>}
  </>
}