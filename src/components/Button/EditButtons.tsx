import React from "react"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { SessionEventAttributes } from "../../entities/Event/types"
import { useEventsContext } from "../../context/Event"

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

  const loading = state.modifying.has(event.id)

  return (
    <div className="EditButtons">
      {!event.rejected && (
        <Button
          basic
          size="small"
          onClick={prevent(() => state.reject(event.id))}
          loading={loading}
          disabled={loading}
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
        disabled={loading}
      >
        {l("components.button.edit_buttons.approve")}
      </Button>
    </div>
  )
}
