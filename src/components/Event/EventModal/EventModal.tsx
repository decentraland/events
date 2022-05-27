import React, { useState } from "react"

import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal"

import { SessionEventAttributes } from "../../../entities/Event/types"
import closeIcon from "../../../images/remove.svg"
import AttendingButtons from "../../Button/AttendingButtons"
import EditButtons from "../../Button/EditButtons"
import EventSection from "../EventSection"
import EventAttendeeList from "./EventAttendeeList/EventAttendeeList"
import EventDetail from "./EventDetail/EventDetail"
import "./EventModal.css"
import EventStatusBanner from "./EventStatusBanner/EventStatusBanner"

export type EventModalProps = Omit<ModalProps, "open" | "children"> & {
  event?: SessionEventAttributes | null
}

export default function EventModal({
  event,
  onClose,
  className,
  ...props
}: EventModalProps) {
  const [attendees, setAttendees] = useState(false)
  const showAttendees = event && attendees
  const showEvent = event && !attendees
  const showSocialActions = event && !attendees && event.approved
  const showApproveActions =
    event && !attendees && !event.approved && event.editable

  return (
    <Modal
      {...props}
      open={!!event}
      className={TokenList.join([
        "EventModal",
        (!event || !event.approved) && "pending",
        className,
      ])}
      onClose={onClose}
    >
      {showAttendees && (
        <EventAttendeeList
          event={event!}
          onBack={() => setAttendees(false)}
          onClose={onClose}
        />
      )}

      {showEvent && (
        <div className="EventModal__Action" onClick={onClose}>
          <div className="EventModal__Action__Background" />
          <img src={closeIcon} width="14" height="14" />
        </div>
      )}
      {showEvent && <ImgFixed src={event!.image || ""} dimension="wide" />}
      {showEvent && <EventStatusBanner event={event!} />}
      {showEvent && (
        <EventDetail
          event={event!}
          onClickAttendees={() => setAttendees(true)}
        />
      )}

      {(showSocialActions || showApproveActions) && <EventSection.Divider />}

      {/* SOCIAL */}
      {showSocialActions && (
        <EventSection>
          <AttendingButtons event={event!} />
        </EventSection>
      )}

      {/* APPROVE */}
      {showApproveActions && (
        <EventSection>
          <EditButtons event={event!} />
        </EventSection>
      )}
    </Modal>
  )
}
