import React from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { SessionEventAttributes } from "events-type/src/types/Event"
import { useEventsContext } from "events-web/src/context/Event"
import { isPastEvent } from "events-web/src/entities/Event/utils"

import "./EditButtons.css"

export type EditButtonsProps = {
  event: SessionEventAttributes
}

export default function EditButtons(props: EditButtonsProps) {
  const event = props.event
  const [, state] = useEventsContext()
  const l = useFormatMessage()
  if (event.approved) {
    return null
  }

  const isPast = React.useMemo(() => isPastEvent(event), [event])

  const loading = state.modifying.has(event.id)

  return (
    <div className="edit-buttons">
      {!event.rejected && (
        <Button
          basic
          size="small"
          onClick={prevent(() => state.reject(event.id))}
          loading={loading}
          disabled={loading || isPast}
        >
          {l("components.button.edit_buttons.reject")}
        </Button>
      )}
      {event.rejected && (
        <Button
          inverted
          primary
          size="small"
          onClick={prevent(() => state.restore(event.id))}
          loading={loading}
          disabled={loading}
        >
          {l("components.button.edit_buttons.restore")}
        </Button>
      )}
      <Button
        primary
        size="small"
        onClick={prevent(() => state.approve(event.id))}
        loading={loading}
        disabled={loading || isPast}
      >
        {l("components.button.edit_buttons.approve")}
      </Button>
    </div>
  )
}
