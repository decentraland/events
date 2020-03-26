import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import classname from 'decentraland-gatsby/dist/utils/classname'
import { EventAttributes, PublicEventAttributes } from '../../entities/Event/types'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import Events, { UpdateEvent } from '../../api/Events'
import stores from '../../store'
import { useLocation } from '@reach/router'
import url from '../../url'

const share = require('../../images/share.svg')

import './SocialButtons.css'

type SocialButtonState = {
  loading: boolean
}

export type SocialButton = {
  event: EventAttributes,
  onShareFallback?: (e: React.MouseEvent<any>, event: EventAttributes) => void
}

export default function SocialButton(props: SocialButton) {

  const event: PublicEventAttributes = props.event as any
  const [state, patchState] = usePatchState<SocialButtonState>({ loading: false })
  const [profile, loadingProfile, actions] = useProfile()
  const location = useLocation()
  const loading = loadingProfile || state.loading

  function updateEvent(update: UpdateEvent) {
    patchState({ loading: true })
    Promise.resolve(profile || actions.connect())
      .then(async (profile) => {
        if (profile) {
          const newEvent = await Events.get().updateEvent(update)
          stores.event.setEntity(newEvent)
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

  function handleAttend(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) {
      return
    }

    patchState({ loading: true })
    Promise.resolve(profile || actions.connect())
      .then(async (profile) => {
        if (profile) {
          const newAttendees = await Events.get().setEventAttendee(event.id, !event.attending)
          const newEvent = {
            ...event,
            attending: !event.attending,
            total_attendees: newAttendees.length,
            latest_attendees: newAttendees.slice(0, 10)
          }
          stores.event.setEntity(newEvent as any)
        }
      })
      .then(() => patchState({ loading: false }))
      .catch((err) => {
        console.error(err)
        patchState({ loading: false })
      })
  }

  function handleShare(e: React.MouseEvent<any>) {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({
        title: event.name,
        text: event.description,
        url: location.origin + url.toEvent(location, event.id),
      })
    } else if (props.onShareFallback) {
      e.preventDefault()
      e.stopPropagation()
      props.onShareFallback(e, props.event)
    }
  }

  if (!event.approved && event.editable) {
    return <div className="SocialButtons pending">
      {!event.rejected && <Button basic size="small" onClick={handleReject} loading={loading} disabled={loading}>REJECT</Button>}
      {event.rejected && <Button inverted primary size="small" onClick={handleRestore} loading={loading} disabled={loading}>RESTORE</Button>}
      <Button primary size="small" onClick={handleApprove} loading={loading} disabled={loading}>APPROVE</Button>
    </div>
  }

  return <div className="SocialButtons">
    <Button inverted size="small" onClick={handleAttend} loading={loading} disabled={loading || !event.approved} className={classname(['attending-status', event.attending && 'attending'])}>
      {event.attending && 'GOING'}
      {!event.attending && 'WANT TO GO'}
    </Button>
    <Button inverted primary size="small" className="share" disabled={loading || !event.approved} onClick={handleShare}>
      <img src={share} width="16" height="16" />
    </Button>
  </div>
}