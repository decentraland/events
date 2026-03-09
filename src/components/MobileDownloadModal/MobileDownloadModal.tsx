import React, { useCallback, useState } from "react"

import useAdvancedUserAgentData from "decentraland-gatsby/dist/hooks/useAdvancedUserAgentData"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

import {
  MobileDownloadModal as BaseMobileDownloadModal,
  launchDesktopApp,
  styled,
} from "decentraland-ui2"

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
    <BaseMobileDownloadModal
      open={open}
      title={l("components.modal.download.title")}
      description={l("components.modal.mobile_download.description")}
      onClose={onClose}
    />
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
