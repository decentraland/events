import React from 'react'
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal";
import TokenList from 'decentraland-gatsby/dist/utils/TokenList';
import { SessionEventAttributes } from "../../../entities/Event/types";
import EventAttendeeList from './EventAttendeeList/EventAttendeeList';
import EventDetail from './EventDetail/EventDetail';
import AttendingButtons from '../../Button/AttendingButtons';
import EditButtons from '../../Button/EditButtons';
import EventSection from '../EventSection';

import './EventModal.css'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed';

const close = require('../../../images/remove.svg')

export type EventModalProps = Omit<ModalProps, 'open' | 'children'> & {
  event?: SessionEventAttributes | null
  attendees?: boolean
  updating?: boolean
  utc?: boolean
  onClickEdit?: (event: React.MouseEvent<HTMLElement>, data: SessionEventAttributes) => void
  onClickAttendees?: (event: React.MouseEvent<HTMLElement>, data: SessionEventAttributes) => void
  onClickDetails?: (event: React.MouseEvent<HTMLElement>, data: SessionEventAttributes) => void
  onChangeEvent?: (event: React.MouseEvent<HTMLElement>, data: SessionEventAttributes) => void
}

export default function EventModal({ event, attendees, edit, utc, className, onClose, onClickEdit, onClickAttendees, onChangeEvent, onClickDetails, ...props }: EventModalProps) {

  return <Modal {...props} open={!!event} className={TokenList.join(['EventModal', (!event || !event.approved) && 'pending', className])} onClose={onClose} >
    {event && attendees && <EventAttendeeList event={event} onBack={onClickDetails} onClose={onClose} />}

    {event && !attendees && <div className="EventModal__Action" onClick={onClose}>
      <div className="EventModal__Action__Background" />
      <img src={close} width="14" height="14" />
    </div>}
    {event && !attendees && <ImgFixed src={event.image || ''} dimension="wide" />}
    {event && !attendees && <EventDetail event={event} utc={utc} onClickEdit={onClickEdit} onClickAttendees={onClickAttendees} />}

    {/* SOCIAL */}
    {event && !attendees && event.approved && <EventSection.Divider />}
    {event && !attendees && event.approved && <EventSection>
      <AttendingButtons loading={props.updating} event={event} onChangeEvent={onChangeEvent} />
    </EventSection>}

    {/* APPROVE */}
    {event && !attendees && !event.approved && event.editable && <EventSection.Divider />}
    {event && !attendees && !event.approved && event.editable && <EventSection>
      <EditButtons loading={props.updating} event={event} onChangeEvent={onChangeEvent} />
    </EventSection>}
  </Modal>
}