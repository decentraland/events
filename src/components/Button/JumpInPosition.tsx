import React from "react"

import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

import { JumpIn } from "decentraland-ui2"

import { EventAttributes } from "../../entities/Event/types"
import { eventClientOptions } from "../../entities/Event/utils"
import locations from "../../modules/locations"
import { SegmentEvent } from "../../modules/segment"
import { getRealms } from "../../modules/servers"

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
  const [servers] = useAsyncMemo(getRealms)

  const isPosition = !!event
  const position = isPosition ? event && `${event.x},${event.y}` : "HTTP"
  const displayPosition = (event?.world ? event.server : position) || undefined

  const handleTrack = (data: Record<string, any>) => {
    track(SegmentEvent.JumpIn, {
      eventId: event?.id || null,
      trending: event?.trending || false,
      highlighted: event?.highlighted || false,
      world: event?.world || false,
      world_name: event?.world ? event.server : false,
      has_launcher: data.has_launcher,
    })
  }

  return (
    <JumpIn
      variant="link"
      position={displayPosition}
      compact={compact}
      desktopAppOptions={event ? eventClientOptions(event, servers) : undefined}
      downloadUrl={event ? locations.download(event.id) : undefined}
      onTrack={handleTrack}
      modalProps={{
        title: l("components.modal.download.title"),
        description: l("components.modal.download.description"),
        buttonLabel: l("components.modal.download.button_label"),
      }}
      {...props}
    />
  )
}
