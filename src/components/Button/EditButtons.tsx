import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { SessionEventAttributes } from '../../entities/Event/types'

import './EditButtons.css'

export type EditButtonsProps = {
  event: SessionEventAttributes,
  loading?: boolean,
  onChangeEvent?: (e: React.MouseEvent<any>, event: SessionEventAttributes) => void
}

export default function EditButtons(props: EditButtonsProps) {
  const event = props.event
  const loading = props.loading

  function handleReject(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (props.loading || !props.onChangeEvent) {
      return
    }

    props.onChangeEvent(e, { ...event, rejected: true })
  }

  function handleRestore(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (props.loading || !props.onChangeEvent) {
      return
    }

    props.onChangeEvent(e, { ...event, rejected: false })
  }

  function handleApprove(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (props.loading || !props.onChangeEvent) {
      return
    }

    props.onChangeEvent(e, { ...event, approved: true })
  }

  if (event.approved) {
    return null
  }

  return <div className="EditButtons">
    {!event.rejected && <Button basic size="small" onClick={handleReject} loading={loading} disabled={loading}>REJECT</Button>}
    {event.rejected && <Button inverted primary size="small" onClick={handleRestore} loading={loading} disabled={loading}>RESTORE</Button>}
    <Button primary size="small" onClick={handleApprove} loading={loading} disabled={loading}>APPROVE</Button>
  </div>

}