import React from 'react'
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal";
import TokenList from 'decentraland-gatsby/dist/utils/TokenList';
import { EventAttributes } from "../../../entities/Event/types";
import EventAttendeeList from './EventAttendeeList/EventAttendeeList';
import EventDetail from './EventDetail/EventDetail';

import './EventModal.css'

const close = require('../../../images/remove.svg')

export type EventModalProps = Omit<ModalProps, 'open' | 'children'> & {
  event?: EventAttributes | null
  attendees?: boolean
  onEdit?: () => void
}

export default function EventModal({ event, attendees, edit, className, onClose, onEdit, ...props }: EventModalProps) {

  return <Modal {...props} open={!!event} className={TokenList.join(['EventModal', (!event || !event.approved) && 'pending', className])} onClose={onClose} >
    {event && !attendees && <div className="EventModal__Action" onClick={onClose}>
      <div className="EventModal__Action__Background" />
      <img src={close} width="14" height="14" />
    </div>}
    {event && !attendees && <EventDetail event={event} edit={edit} />}
    {event && attendees && <EventAttendeeList event={event} />}
  </Modal>
}