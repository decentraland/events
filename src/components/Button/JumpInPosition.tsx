import React, { useCallback, useState } from "react"

import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import env from "decentraland-gatsby/dist/utils/env"
import { Button } from "decentraland-ui/dist/components/Button/Button"

import { EventAttributes } from "../../entities/Event/types"
import { eventClientOptions } from "../../entities/Event/utils"
import ExplorerJumpinImage from "../../images/explorer-jumpin-modal.svg"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"
import secondaryPinIcon from "../../images/secondary-pin-small.svg"
import { launchDesktopApp } from "../../modules/desktop"
import { SegmentEvent } from "../../modules/segment"
import { getReamls } from "../../modules/servers"
import ConfirmModal from "../Modal/ConfirmModal"

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
  const l = useFormatMessage()
  const [modalText, setModalText] = useState<
    | {
        title: string
        description: string
        buttonLabel: string
      }
    | false
  >(false)
  const [servers] = useAsyncMemo(getReamls)

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

        setModalText({
          title: l(
            `components.modal.join_in_modal.${
              hasDecentralandLauncher ? "relunch" : "download"
            }.title`
          ),
          description: l(
            `components.modal.join_in_modal.${
              hasDecentralandLauncher ? "relunch" : "download"
            }.description`
          ),
          buttonLabel: l(
            `components.modal.join_in_modal.${
              hasDecentralandLauncher ? "relunch" : "download"
            }.button_label`
          ),
        })
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
      if (event && hasDecentralandLauncher) {
        await launchDesktopApp(eventClientOptions(event, servers))
        track(SegmentEvent.JumpIn, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
          world: event?.world || false,
          world_name: event?.world ? event.server : false,
          has_laucher: !!hasDecentralandLauncher,
        })
      } else if (event && !hasDecentralandLauncher) {
        window.open(
          env("DECENTRALAND_DOWNLOAD_URL", "https://decentraland.org/download"),
          "_blank"
        )
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
      <ConfirmModal open={!!modalText} onClose={() => setModalText(false)}>
        <div>
          <img src={ExplorerJumpinImage} alt="Explorer Jump In" />
        </div>
        <Title>{modalText && modalText.title}</Title>
        <Paragraph>{modalText && modalText.description}</Paragraph>
        <Button
          primary
          onClick={handleModalClick}
          className="jump-in-position__modal-button"
        >
          {modalText && modalText.buttonLabel}
        </Button>
      </ConfirmModal>
    </>
  )
}
