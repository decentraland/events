import React from 'react';
import { Modal, ModalProps } from 'decentraland-ui/dist/components/Modal/Modal';
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList';

import './ConfirmModal.css'

const close = require('../../images/popup-close.svg')


export default function ConfirmModal(props: ModalProps) {

  function handleClose(event: React.MouseEvent<HTMLElement>) {
    if (props.onClose) {
      props.onClose(event, props)
    }
  }

  return <Modal {...props} className={TokenList.join(['ConfirmModal', props.className])}>
    {props.onClose && <div className="ConfirmModal__Close" onClick={handleClose}>
      <img src={close} width="14" height="14" />
    </div>}
    {props.children}
  </Modal>
}