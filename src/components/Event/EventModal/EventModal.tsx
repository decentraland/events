import React from 'react'
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal";
import { EventAttributes } from "../../../entities/Event/types";
import classname from 'decentraland-gatsby/dist/utils/classname';;
import EventDetail from './EventDetail/EventDetail';
import EventShare from './EventShare/EventShare';

import './EventModal.css'
import EventAttendeeList from './EventAttendeeList/EventAttendeeList';

const close = require('../../../images/remove.svg')

export type EventModalProps = Omit<ModalProps, 'open' | 'children'> & {
  event?: EventAttributes | null
  attendees?: boolean
  share?: boolean
  onEdit?: () => void
}

export default function EventModal({ event, attendees, share, edit, className, onClose, onEdit, ...props }: EventModalProps) {

  return <Modal {...props} open={!!event} className={classname(['EventModal', !event?.approved || 'pending', className])}>
    {event && !attendees && !share && <div className="EventModal__Action" onClick={onClose}>
      <img src={close} width="14" height="14" />
      <div className="EventModal__Action__Background" />
    </div>}
    {event && !attendees && !share && <EventDetail event={event} edit={edit} />}
    {event && attendees && !share && <EventAttendeeList event={event} />}
    {event && !attendees && share && <EventShare event={event} />}
  </Modal>
}