import React from "react"
import { EventAttributes } from "../../../../entities/Event/types"

import "./EventStatusBanner.css"

export type EventStatusBannerProp = {
  event?: EventAttributes
}

export default React.memo(function EventStatusBanner({
  event,
}: EventStatusBannerProp) {
  if (!event) {
    return null
  }

  if (event.rejected) {
    return (
      <div className="EventStatusBanner EventStatusBanner--error">
        <code>This event was rejected</code>
      </div>
    )
  }

  if (!event.approved) {
    return (
      <div className="EventStatusBanner">
        <code>This event is pending approval</code>
      </div>
    )
  }

  return null
})
