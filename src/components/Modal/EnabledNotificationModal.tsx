import React from "react"
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import "./EnabledNotificationModal.css"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import locations from "../../modules/locations"

import closeIcon from "../../images/popup-close.svg"

export default function EnabledNotificationModal(
  props: Omit<ModalProps, "children">
) {
  function handleClose(event: React.MouseEvent<HTMLElement>) {
    if (props.onClose) {
      props.onClose(event, props)
    }
  }

  return (
    <Modal
      {...props}
      className={TokenList.join(["EnabledNotificationModal", props.className])}
    >
      {props.onClose && (
        <div className="EnabledNotificationModal__Close" onClick={handleClose}>
          <img src={closeIcon} width="14" height="14" />
        </div>
      )}
      <Title>Notifications</Title>
      <Paragraph>
        Go to settings and setup your notifications preferences!
      </Paragraph>
      <Button
        primary
        style={{ marginTop: "28px" }}
        as="a"
        onClick={prevent(() => navigate(locations.settings()))}
      >
        GO TO SETTINGS
      </Button>
    </Modal>
  )
}
