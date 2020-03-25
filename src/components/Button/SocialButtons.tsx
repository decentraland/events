import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { EventAttributes, PublicEventAttributes } from '../../entities/Event/types'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import Events from '../../api/Events'
import stores from '../../store'

const share = require('../../images/share.svg')

import './SocialButtons.css'
import classname from 'decentraland-gatsby/dist/utils/classname'

type SocialButtonState = {
  loading: boolean
}

export type SocialButton = { event: EventAttributes }

export default function SocialButton(props: SocialButton) {

  const event: PublicEventAttributes = props.event as any
  const [state, patchState] = usePatchState<SocialButtonState>({ loading: false })
  const [profile, loadingProfile, actions] = useProfile()

  const loading = loadingProfile || state.loading

  function handleApprove(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (loading) {
      return
    }

    patchState({ loading: true })
    Promise.resolve(profile || actions.connect())
      .then(async (profile) => {
        if (profile) {
          const newEvent = await Events.get().updateEvent({ id: event.id, approved: true })
          stores.event.setEntity(newEvent)
        }
      })
      .then(() => patchState({ loading: false }))
      .catch((err) => {
        console.error(err)
        patchState({ loading: false })
      })
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

  if (!event.approved && event.editable) {
    return <div className="SocialButtons">
      <Button primary size="small" onClick={handleApprove} loading={loading} disabled={loading} className="pending">APPROVE</Button>
    </div>
  }

  return <div className="SocialButtons">
    <Button inverted size="small" onClick={handleAttend} loading={loading} disabled={loading || !event.approved} className={classname(['attending-status', event.attending && 'attending'])}>
      {event.attending && 'GOING'}
      {!event.attending && 'WANT TO GO'}
    </Button>
    <Button inverted primary size="small" className="share" disabled={loading || !event.approved}>
      <img src={share} width="16" height="16" />
    </Button>
  </div>
}