import React from "react"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal"

import closeIcon from "../images/popup-close.svg"

import "./ConfirmModal.css"

export default function ConfirmModal(props: ModalProps) {
  function handleClose(event: React.MouseEvent<HTMLElement>) {
    if (props.onClose) {
      props.onClose(event, props)
    }
  }

  return (
    <Modal
      {...props}
      className={TokenList.join(["confirm-modal", props.className])}
    >
      {props.onClose && (
        <div className="confirm-modal__close" onClick={handleClose}>
          <img src={closeIcon} width="14" height="14" />
        </div>
      )}
      {props.children}
    </Modal>
  )
}
