import React, { useCallback, useMemo, useState } from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import {
  Content,
  ImageContainer,
  StyledDescription,
  StyledTitle,
} from "decentraland-ui2/dist/components/Modal/DownloadModal/DownloadModal.styled"
import { ExplorerJumpIn } from "decentraland-ui2/dist/components/Modal/DownloadModal/ExplorerJumpIn"

import { dclModal } from "decentraland-ui2"

import { MobileStoreBadges } from "../MobileStoreBadges/MobileStoreBadges"

const { Modal } = dclModal

export interface MobileDownloadModalProps {
  open: boolean
  onClose: () => void
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({
  open,
  onClose,
}) => {
  const l = useFormatMessage()

  return (
    <Modal open={open} size="tiny" title=" " onClose={onClose}>
      <Content>
        <ImageContainer>
          <ExplorerJumpIn />
        </ImageContainer>
        <StyledTitle variant="h2">
          {l("components.modal.download.title")}
        </StyledTitle>
        <StyledDescription variant="body1">
          {l("components.modal.mobile_download.description")}
        </StyledDescription>
        <MobileStoreBadges size="large" />
      </Content>
    </Modal>
  )
}

/**
 * Wraps children (e.g., <JumpIn>) and intercepts clicks on mobile
 * to show a custom modal with store badges instead of the built-in DownloadModal.
 */
export function useIsMobileDevice() {
  return useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    []
  )
}

export function MobileJumpInWrapper({
  isMobile: isMobileProp,
  children,
}: {
  isMobile?: boolean
  children: React.ReactNode
}) {
  const isMobileDevice = useIsMobileDevice()
  const isMobile = isMobileProp ?? isMobileDevice
  const [showModal, setShowModal] = useState(false)

  const handleCapture = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.stopPropagation()
        e.preventDefault()
        setShowModal(true)
      }
    },
    [isMobile]
  )

  return (
    <>
      <div onClickCapture={handleCapture} style={{ display: "contents" }}>
        {children}
      </div>
      <MobileDownloadModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
