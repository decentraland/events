import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { SessionEventAttributes } from '../../entities/Event/types'

import './EditButtons.css'
import { useEventsContext } from '../../context/Event'
import prevent from 'decentraland-gatsby/dist/utils/react/prevent'

export type EditButtonsProps = {
  event: SessionEventAttributes,
}

export default function EditButtons(props: EditButtonsProps) {
  const event = props.event
  const [ , state ] = useEventsContext()
  if (event.approved) {
    return null
  }

  const loading = state.modifying.has(event.id)

  return <div className="EditButtons">
    {!event.rejected && <Button basic size="small" onClick={prevent(() => state.reject(event.id))} loading={loading} disabled={loading}>REJECT</Button>}
    {event.rejected && <Button inverted primary size="small" onClick={prevent(() => state.restore(event.id))} loading={loading} disabled={loading}>RESTORE</Button>}
    <Button primary size="small" onClick={prevent(() => state.approve(event.id))} loading={loading} disabled={loading}>APPROVE</Button>
  </div>

}