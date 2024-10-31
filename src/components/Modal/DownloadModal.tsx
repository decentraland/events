import React, { useCallback } from "react"

import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Modal, ModalProps } from "decentraland-ui/dist/components/Modal/Modal"

import ExplorerJumpinImage from "../../images/explorer-jumpin-modal.svg"
import closeIcon from "../../images/popup-close.svg"

import "./DownloadModal.css"

export default function DownloadModal(props: ModalProps) {
  const { onModalClick, onClose } = props
  const l = useFormatMessage()

  const handleClose = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (onClose) {
        onClose(event, props)
      }
    },
    [onClose, props]
  )

  return (
    <Modal
      {...props}
      className={TokenList.join(["download-modal", props.className])}
    >
      <div className="download-modal__close" onClick={handleClose}>
        <img src={closeIcon} width="14" height="14" />
      </div>

      <div>
        <img src={ExplorerJumpinImage} alt="Explorer Jump In" />
      </div>
      <Title>{l(`components.modal.download.title`)}</Title>
      <Paragraph>{l(`components.modal.download.description`)}</Paragraph>
      <Button
        primary
        onClick={onModalClick}
        className="jump-in-position__modal-button"
      >
        {l(`components.modal.download.button_label`)}
      </Button>
    </Modal>
  )
}
