import React from 'react'
import { navigate } from 'gatsby'
import { EventAttributes } from '../../../entities/Event/types'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import { toMonthName, toDayNumber, toDayName } from '../../Date/utils'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import Divider from 'decentraland-gatsby/dist/components/Text/Divider'
import Italic from 'decentraland-gatsby/dist/components/Text/Italic'
import Link from 'decentraland-gatsby/dist/components/Text/Link'
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar'
import SocialButton from '../../Button/SocialButtons'
import JumpInButton from '../../Button/JumpInButton'
import AddToCalendarButton from '../../Button/AddToCalendarButton'
import DateBox from '../../Date/DateBox'
import { useLocation } from '@reach/router'

const info = require('../../../images/secondary-info.svg')
const clock = require('../../../images/secondary-clock.svg')
const pin = require('../../../images/secondary-pin.svg')
const friends = require('../../../images/secondary-friends.svg')

import './EventDetail.css'
import url from '../../../url'
import classname from 'decentraland-gatsby/dist/utils/classname'

const DAY = 1000 * 60 * 60 * 24
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'
const EVENTS_LIST = 1

export type EventDetailProps = {
  event: EventAttributes
}

export default function EventDetail({ event }: EventDetailProps) {
  const now = new Date()
  const { start_at, finish_at } = event || { start_at: now, finish_at: now }
  const duration = finish_at.getTime() - start_at.getTime()
  const position = (event?.coordinates || [0, 0]).join()
  const attendeesDiff = event.total_attendees - EVENTS_LIST
  const location = useLocation()

  return <>
    {event && <ImgFixed src={event.image} dimension="wide" />}
    {event && !event.approved && <div className="EventNote"><code>This event is pending approval</code></div>}
    {event && <div className="EventDetail">
      {/* <Modal.Header>{event.name}</Modal.Header> */}
      <div className="EventDetail__Header">
        <DateBox date={start_at} />
        <div className="EventDetail__Header__Event">
          <SubTitle>{event.name}</SubTitle>
          <Paragraph secondary>Public, Organized by <Link>{event.user_name || 'Guest'}</Link></Paragraph>
        </div>
      </div>

      {/* DESCRIPTION */}
      <Divider line />
      <div className="EventDetail__Detail">
        <div className="EventDetail__Detail__Icon">
          <img src={info} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          {event.description && <Paragraph>{event.description}</Paragraph>}
          {!event.description && <Paragraph secondary={!event.description} >
            <Italic>No description</Italic>
          </Paragraph>}
        </div>
        <div className="EventDetail__Detail__Action"></div>
      </div>

      {/* DATE */}
      <Divider line />
      <div className="EventDetail__Detail">
        <div className="EventDetail__Detail__Icon">
          <img src={clock} width="16" height="16" />
        </div>

        {duration < DAY && <div className="EventDetail__Detail__Item">
          <Paragraph >
            {toDayName(start_at, { capitalized: true })}
            {', '}
            {toMonthName(start_at, { capitalized: true })}
            {' '}
            {start_at.getDate()}
            {' from '}
            {start_at.getHours()}
            {start_at.getHours() > 12 ? 'pm' : 'am'}
            {' to '}
            {finish_at.getHours()}
            {finish_at.getHours() > 12 ? 'pm' : 'am'}
          </Paragraph>
        </div>}
        {duration >= DAY && <div className="EventDetail__Detail__Item">
          <Paragraph >
            <code>{'FROM: '}</code>
            {toDayName(start_at, { capitalized: true })}
            {', '}
            {toMonthName(start_at, { capitalized: true })}
            {' '}
            {start_at.getDate()}
            {' '}
            {start_at.getHours()}
            {start_at.getHours() > 12 ? 'pm' : 'am'}
          </Paragraph>
          <Paragraph >
            <code>{'  TO: '}</code>
            {toDayName(finish_at, { capitalized: true })}
            {', '}
            {toMonthName(finish_at, { capitalized: true })}
            {' '}
            {finish_at.getDate()}
            {' '}
            {finish_at.getHours()}
            {finish_at.getHours() > 12 ? 'pm' : 'am'}
          </Paragraph>
        </div>}
        <div className="EventDetail__Detail__Action">
          <AddToCalendarButton event={event} />
        </div>
      </div>

      {/* PLACE */}
      <Divider line />
      <div className="EventDetail__Detail">
        <div className="EventDetail__Detail__Icon">
          <img src={pin} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          <Paragraph>
            {event.scene_name || 'Decentraland'}
            {position !== '0,0' && `(${position})`}
          </Paragraph>
        </div>
        <div className="EventDetail__Detail__Action">
          <JumpInButton size="small" event={event} />
        </div>
      </div>

      {/* ATTENDEES */}
      <Divider line />
      <div className="EventDetail__Detail">
        <div className={classname(['EventDetail__Detail__Icon', event.total_attendees > 0 && 'center'])}>
          <img src={friends} width="16" height="16" />
        </div>
        <div className="EventDetail__Detail__Item">
          {(event.latest_attendees || []).slice(0, EVENTS_LIST).map((address) => <ImgAvatar key={address} size="small" address={address} src={`${EVENTS_URL}/profile/${address}/face.png`} />)}
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

      {/* SOCIAL */}
      <Divider line />
      <div className="EventDetail__Actions">
        <SocialButton event={event} onShareFallback={() => navigate(url.toEventShare(location, event.id))} />
      </div>
    </div>}
  </>
}