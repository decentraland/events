import React from 'react'
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal";
import { EventAttributes } from "../../entities/Event/types";
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed';
import classname from 'decentraland-gatsby/dist/utils/classname';
import Divider from 'decentraland-gatsby/dist/components/Text/Divider';

import './EventModal.css'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph';
import Italic from 'decentraland-gatsby/dist/components/Text/Italic';
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle';
import { Button } from 'decentraland-ui/dist/components/Button/Button';
import JumpInButton from '../Button/JumpInButton';
import { toDayName, toMonthName, toDayNumber } from '../Date/utils';
import Link from 'decentraland-gatsby/dist/components/Text/Link';
import ImgAvatar from 'decentraland-gatsby/dist/components/Profile/ImgAvatar';
import SocialButton from '../Button/SocialButtons';
import AddToCalendarButton from '../Button/AddToCalendarButton';

const close = require('../../images/remove.svg')
const info = require('../../images/secondary-info.svg')
const clock = require('../../images/secondary-clock.svg')
const pin = require('../../images/secondary-pin.svg')
const friends = require('../../images/secondary-friends.svg')

const DAY = 1000 * 60 * 60 * 24
const EVENTS_URL = process.env.GATSBY_EVENTS_URL || '/api'

export type EventModalProps = Omit<ModalProps, 'open' | 'children'> & {
  event?: EventAttributes | null
  attendees?: boolean
  share?: boolean
}

export default function EventModal({ event, attendees, share, className, ...props }: EventModalProps) {

  const now = new Date()
  const { start_at, finish_at } = event || { start_at: now, finish_at: now }
  const duration = finish_at.getTime() - start_at.getTime()
  const position = (event?.coordinates || [0, 0]).join()

  return <Modal {...props} open={!!event} className={classname(['EventModal', !event?.approved || 'pending', className])}>
    {event && <div className="EventModal__Close" onClick={props.onClose}>
      <img src={close} width="14" height="14" />
      <div className="EventModal__Close__Background" />
    </div>}
    {event && <ImgFixed src={event.image} dimension="wide" />}
    {event && !event.approved && <div className="EventModal__Note"><code>This event is pending approval</code></div>}
    {event && <Modal.Content>
      {/* <Modal.Header>{event.name}</Modal.Header> */}
      <div className="EventModal__Header">
        <div className="EventModal__Header__Date">
          <div className="EventModal__Header__Date__Month">{toMonthName(start_at, { short: true })}</div>
          <div className="EventModal__Header__Date__Day">{toDayNumber(start_at)}</div>
        </div>
        <div className="EventModal__Header__Event">
          <SubTitle>{event.name}</SubTitle>
          <Paragraph secondary>Public, Organized by <Link>{event.user_name || 'Guest'}</Link></Paragraph>
        </div>
      </div>

      {/* DESCRIPTION */}
      <Divider line />
      <div className="EventModal__Detail">
        <div className="EventModal__Detail__Icon">
          <img src={info} width="16" height="16" />
        </div>
        <div className="EventModal__Detail__Item">
          {event.description && <Paragraph>{event.description}</Paragraph>}
          {!event.description && <Paragraph secondary={!event.description} >
            <Italic>No description</Italic>
          </Paragraph>}
        </div>
        <div className="EventModal__Detail__Action"></div>
      </div>

      {/* DATE */}
      <Divider line />
      <div className="EventModal__Detail">
        <div className="EventModal__Detail__Icon">
          <img src={clock} width="16" height="16" />
        </div>

        {duration < DAY && <div className="EventModal__Detail__Item">
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
        {duration >= DAY && <div className="EventModal__Detail__Item">
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
        <div className="EventModal__Detail__Action">
          <AddToCalendarButton event={event} />
        </div>
      </div>

      {/* PLACE */}
      <Divider line />
      <div className="EventModal__Detail">
        <div className="EventModal__Detail__Icon">
          <img src={pin} width="16" height="16" />
        </div>
        <div className="EventModal__Detail__Item">
          <Paragraph>
            {event.scene_name || 'Decentraland'}
            {position !== '0,0' && `(${position})`}
          </Paragraph>
        </div>
        <div className="EventModal__Detail__Action">
          <JumpInButton size="small" event={event} />
        </div>
      </div>
      <Divider line />
      <div className="EventModal__Detail">
        <div className="EventModal__Detail__Icon center">
          <img src={friends} width="16" height="16" />
        </div>
        <div className="EventModal__Detail__Item">
          {(event.latest_attendees || []).map((address) => <ImgAvatar key={address} size="small" address={address} src={`${EVENTS_URL}/profile/${address}/face.png`} />)}
          {event.total_attendees === 0 && <Paragraph secondary><Italic>Nobody confirmed yet</Italic></Paragraph>}
          {event.total_attendees > 10 && null}
        </div>
        <div className="EventModal__Detail__Action" />
      </div>
      <Divider line />
      <div className="EventModal__Actions">
        <SocialButton event={event} />
      </div>
    </Modal.Content>}
  </Modal>
}