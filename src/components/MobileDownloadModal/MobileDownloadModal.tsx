import React, { useCallback, useState } from "react"

import useAdvancedUserAgentData from "decentraland-gatsby/dist/hooks/useAdvancedUserAgentData"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { ExplorerJumpIn } from "decentraland-ui2/dist/components/Modal/DownloadModal/ExplorerJumpIn"
import {
  ModalContent,
  ModalDescription,
  ModalImageContainer,
  ModalTitle,
} from "decentraland-ui2/dist/components/Modal/MobileDownloadModal/MobileDownloadModal.styled"
import { Modal } from "decentraland-ui2/dist/components/Modal/Modal"

import { launchDesktopApp, styled } from "decentraland-ui2"

import { MobileStoreBadges } from "../MobileStoreBadges/MobileStoreBadges"

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
    <Modal open={open} size="tiny" onClose={onClose}>
      <ModalContent>
        <ModalImageContainer>
          <ExplorerJumpIn />
        </ModalImageContainer>
        <ModalTitle variant="h2">
          {l("components.modal.download.title")}
        </ModalTitle>
        <ModalDescription variant="body1">
          {l("components.modal.mobile_download.description")}
        </ModalDescription>
        <MobileStoreBadges size="large" />
      </ModalContent>
    </Modal>
  )
}

const CaptureContainer = styled("div")({
  display: "contents",
})

export function MobileJumpInWrapper({
  children,
  desktopAppOptions,
}: {
  children: React.ReactNode
  desktopAppOptions?: Parameters<typeof launchDesktopApp>[0]
}) {
  const [, userAgentData] = useAdvancedUserAgentData()
  const isAndroid =
    (userAgentData?.mobile ?? false) && userAgentData?.os?.name === "Android"
  const [showModal, setShowModal] = useState(false)

  const handleCapture = useCallback(
    async (e: React.MouseEvent) => {
      if (isAndroid) {
        e.stopPropagation()
        e.preventDefault()
        // The mobile app also handles decentraland:// deep links
        const hasLauncher = await launchDesktopApp(desktopAppOptions ?? {})
        if (!hasLauncher) {
          setShowModal(true)
        }
      }
    },
    [isAndroid, desktopAppOptions]
  )

  return (
    <>
      <CaptureContainer onClickCapture={handleCapture}>
        {children}
      </CaptureContainer>
      <MobileDownloadModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
