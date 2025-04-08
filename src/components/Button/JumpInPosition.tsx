import React, { useCallback, useState } from "react"

import DownloadModal from "decentraland-gatsby/dist/components/Modal/DownloadModal"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import { EventAttributes } from "../../entities/Event/types"
import { eventClientOptions } from "../../entities/Event/utils"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"
import secondaryPinIcon from "../../images/secondary-pin-small.svg"
import { launchDesktopApp } from "../../modules/desktop"
import locations from "../../modules/locations"
import { SegmentEvent } from "../../modules/segment"
import { getRealms } from "../../modules/servers"

import "./JumpInPosition.css"

export type JumpInPositionProps = React.HTMLProps<HTMLAnchorElement> & {
  event?: EventAttributes
  compact?: boolean
}

export default function JumpInPosition({
  event,
  compact,
  ...props
}: JumpInPositionProps) {
  const track = useTrackContext()
  const [showModal, setShowModal] = useState(false)
  const [servers] = useAsyncMemo(getRealms)

  const isPosition = !!event
  const position = isPosition ? event && `${event.x},${event.y}` : "HTTP"

  let hasDecentralandLauncher: null | boolean = null

  const handleClick = useCallback(
    async function (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
      e.stopPropagation()
      e.preventDefault()
      if (event) {
        hasDecentralandLauncher = await launchDesktopApp(
          eventClientOptions(event, servers)
        )

        !hasDecentralandLauncher && setShowModal(true)
      }

      track(SegmentEvent.JumpIn, {
        eventId: event?.id || null,
        trending: event?.trending || false,
        highlighted: event?.highlighted || false,
        world: event?.world || false,
        world_name: event?.world ? event.server : false,
        has_laucher: !!hasDecentralandLauncher,
      })
    },
    [event, track, servers]
  )

  const handleModalClick = useCallback(
    async function (e: React.MouseEvent<HTMLButtonElement>) {
      e.stopPropagation()
      e.preventDefault()
      if (event) {
        window.open(locations.download(event.id), "_blank")
      }
    },
    [event, track, servers, hasDecentralandLauncher]
  )

  return (
    <>
      <Link
        {...props}
        target="_blank"
        onClick={handleClick}
        className={TokenList.join([
          "jump-in-position",
          compact && "jump-in-position--compact",
          props.className,
        ])}
      >
        <span className="jump-in-position__position">
          {isPosition && <img src={secondaryPinIcon} width="16" height="16" />}
          <span>{event?.world ? event.server : position}</span>
        </span>
        <span className="jump-in-position__icon">
          <img src={primaryJumpInIcon} width={16} height={16} />
        </span>
      </Link>
      <DownloadModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onModalClick={handleModalClick}
      />
    </>
  )
}
