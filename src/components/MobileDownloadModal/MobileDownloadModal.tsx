import React, { useCallback, useState } from "react"

import useAdvancedUserAgentData from "decentraland-gatsby/dist/hooks/useAdvancedUserAgentData"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import {
  Content,
  ImageContainer,
  StyledDescription,
  StyledTitle,
} from "decentraland-ui2/dist/components/Modal/DownloadModal/DownloadModal.styled"
import { ExplorerJumpIn } from "decentraland-ui2/dist/components/Modal/DownloadModal/ExplorerJumpIn"

import { dclModal, launchDesktopApp, styled } from "decentraland-ui2"

import { MobileStoreBadges } from "../MobileStoreBadges/MobileStoreBadges"

const { Modal } = dclModal

const CaptureContainer = styled("div")({
  display: "contents",
})

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

export function MobileJumpInWrapper({
  children,
  desktopAppOptions,
}: {
  children: React.ReactNode
  desktopAppOptions?: Parameters<typeof launchDesktopApp>[0]
}) {
  const [, userAgentData] = useAdvancedUserAgentData()
  const isMobile = userAgentData?.mobile ?? false
  const [showModal, setShowModal] = useState(false)

  const handleCapture = useCallback(
    async (e: React.MouseEvent) => {
      if (isMobile) {
        e.stopPropagation()
        e.preventDefault()
        // The mobile app also handles decentraland:// deep links
        const hasLauncher = await launchDesktopApp(desktopAppOptions ?? {})
        if (!hasLauncher) {
          setShowModal(true)
        }
      }
    },
    [isMobile, desktopAppOptions]
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
