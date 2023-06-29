import React from "react"

import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal"
import locations from "events-web/src/modules/locations"

import closeIcon from "../images/popup-close.svg"

import "./EnabledNotificationModal.css"

export default function EnabledNotificationModal(
  props: Omit<ModalProps, "children">
) {
  const l = useFormatMessage()
  function handleClose(event: React.MouseEvent<HTMLElement>) {
    if (props.onClose) {
      props.onClose(event, props)
    }
  }

  return (
    <Modal
      {...props}
      className={TokenList.join([
        "enabled-notification-modal",
        props.className,
      ])}
    >
      {props.onClose && (
        <div
          className="enabled-notification-modal__close"
          onClick={handleClose}
        >
          <img src={closeIcon} width="14" height="14" />
        </div>
      )}
      <Title>
        {l("components.modal.enabled_notification_modal.notifications")}
      </Title>
      <Paragraph>
        {l(
          "components.modal.enabled_notification_modal.go_to_settings_paragraph"
        )}
      </Paragraph>
      <Button
        primary
        style={{ marginTop: "28px" }}
        as="a"
        onClick={prevent(() => navigate(locations.settings()))}
      >
        {l("components.modal.enabled_notification_modal.go_to_settings")}
      </Button>
    </Modal>
  )
}
