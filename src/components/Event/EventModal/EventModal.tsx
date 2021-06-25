import React, { useState } from 'react'
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal";
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList';
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
}

export default function EventModal({ event, onClose, className, ...props }: EventModalProps) {
  const [ attendees, setAttendees ] = useState(false)
  const showAttendees = event && attendees
  const showEvent = event && !attendees
  const showSocialActions = event && !attendees && event.approved
  const showApproveActions = event && !attendees && !event.approved && event.editable

  return <Modal {...props} open={!!event} className={TokenList.join(['EventModal', (!event || !event.approved) && 'pending', className])} onClose={onClose} >
    {showAttendees && <EventAttendeeList event={event!} onBack={() => setAttendees(false)} onClose={onClose} />}

    {showEvent && <div className="EventModal__Action" onClick={onClose}>
      <div className="EventModal__Action__Background" />
      <img src={close} width="14" height="14" />
    </div>}
    {showEvent && <ImgFixed src={event!.image || ''} dimension="wide" />}
    {showEvent && <EventDetail event={event!} onClickAttendees={() => setAttendees(true)} />}

    {(showSocialActions || showApproveActions) && <EventSection.Divider />}

    {/* SOCIAL */}
    {showSocialActions && <EventSection>
      <AttendingButtons loading={props.updating} event={event!} />
    </EventSection>}

    {/* APPROVE */}
    {showApproveActions && <EventSection>
      <EditButtons loading={props.updating} event={event!} />
    </EventSection>}
  </Modal>
}