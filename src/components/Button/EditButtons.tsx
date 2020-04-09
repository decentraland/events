import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { EventAttributes, PublicEventAttributes } from '../../entities/Event/types'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import track from 'decentraland-gatsby/dist/components/Segment/track'
import Events, { UpdateEvent } from '../../api/Events'
import stores from '../../utils/store'
import * as segment from '../../utils/segment'

import './EditButtons.css'

type EditButtonsState = {
  loading: boolean
}

export type EditButtonsProps = {
  event: EventAttributes,
  loading?: boolean,
  onSave?: (e: React.MouseEvent<any>, event: EventAttributes) => void
}

export default function EditButtons(props: EditButtonsProps) {

  const event: PublicEventAttributes = props.event as any
  const [state, patchState] = usePatchState<EditButtonsState>({ loading: false })
  const [profile, actions] = useProfile()
  const loading = actions.loading || state.loading || props.loading

  function updateEvent(update: UpdateEvent) {
    patchState({ loading: true })
    Promise.resolve(profile || actions.connect())
      .then(async (profile) => {
        if (profile) {
          const newEvent = await Events.get().updateEvent(update)
          stores.event.setEntity(newEvent)
          track((analytics) => analytics.track(segment.Track.EditEvent, { event: newEvent }))
        }
      })
      .then(() => patchState({ loading: false }))
      .catch((err) => {
        console.error(err)
        patchState({ loading: false })
      })
  }

  function handleReject(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) {
      return
    }

    updateEvent({ id: event.id, rejected: true })
  }

  function handleRestore(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) {
      return
    }

    updateEvent({ id: event.id, rejected: false })
  }

  function handleApprove(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) {
      return
    }

    updateEvent({ id: event.id, approved: true })
  }

  function handleSave(e: React.MouseEvent<any>) {
    if (props.onSave) {
      props.onSave(e, event as any)
    }
  }

  return <div className="EditButtons pending">
    {!event.rejected && <Button basic size="small" onClick={handleReject} loading={loading} disabled={loading}>REJECT</Button>}
    {event.rejected && <Button inverted primary size="small" onClick={handleRestore} loading={loading} disabled={loading}>RESTORE</Button>}
    {!props.onSave && <Button primary size="small" onClick={handleApprove} loading={loading} disabled={loading}>APPROVE</Button>}
    {props.onSave && <Button primary size="small" onClick={handleSave} loading={loading} disabled={loading}>SAVE</Button>}
  </div>

}