import React from 'react'
import { Modal } from 'decentraland-ui/dist/components/Modal/Modal'
import useMobileDetector from 'decentraland-gatsby/dist/hooks/useMobileDetector'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import metamaskIcon from '../../images/metamask-logo.svg'
import imtokenIcon from '../../images/imtoken-logo.svg'
import coinbaseIcon from '../../images/coinbasewallet-logo.svg'
import trustIcon from '../../images/trustwallet-logo.svg'
import './WalletRequiredModal.css'

export type WalletRequiredModalProps = {
  open: boolean,
  onClose?: () => void
}

export default function WalletRequiredModal({ open, onClose }: WalletRequiredModalProps) {
  const isMobile = useMobileDetector()

  return <Modal open={open} className="WalletRequiredModal" onClose={onClose}>
    <SubTitle>Get a wallet to continue</SubTitle>
    <Paragraph>A crypto wallet helps you manage your transactions: earn rewards, purchase items, claim your name, and more!</Paragraph>
    <div className="WalletRequiredModal__Wallets">
      <Button inverted primary href="https://metamask.io/" target="_blank">
        <img src={metamaskIcon} width="172" height="33" />
      </Button>
      {isMobile && <Button inverted primary href="https://token.im/" target="_blank">
        <img src={imtokenIcon} width="109" height="18" />
      </Button>}
      {isMobile && <Button inverted primary href="https://wallet.coinbase.com/" target="_blank">
        <img src={coinbaseIcon} width="164" height="28" />
      </Button>}
      {isMobile && <Button inverted primary href="https://trustwallet.com/" target="_blank">
        <img src={trustIcon} width="169" height="38" />
      </Button>}
    </div>
    <Paragraph secondary small>Once you've installed your wallet, you will need to refresh this page to continue</Paragraph>
  </Modal>
}
