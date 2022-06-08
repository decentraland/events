import React from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

import { EventAttributes } from "../../../../entities/Event/types"

import "./EventStatusBanner.css"

export type EventStatusBannerProp = {
  event?: EventAttributes
}

export default React.memo(function EventStatusBanner({
  event,
}: EventStatusBannerProp) {
  const l = useFormatMessage()
  if (!event) {
    return null
  }

  if (event.rejected) {
    return (
      <div className="EventStatusBanner EventStatusBanner--error">
        <code>
          {l(
            "components.event.event_modal.event_status_banner.this_event_was_rejected"
          )}
        </code>
      </div>
    )
  }

  if (!event.approved) {
    return (
      <div className="EventStatusBanner">
        <code>
          {l(
            "components.event.event_modal.event_status_banner.this_event_is_pending_approval"
          )}
        </code>
      </div>
    )
  }

  return null
})
