import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import useMobileDetector from 'decentraland-gatsby/dist/hooks/useMobileDetector'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import track from 'decentraland-gatsby/dist/components/Segment/track'
import { EventAttributes, PublicEventAttributes } from '../../entities/Event/types'
import Events from '../../api/Events'
import stores from '../../utils/store'
import { useLocation } from '@reach/router'
import url from '../../utils/url'
import * as segment from '../../utils/segment'

const share = require('../../images/share.svg')

import './AttendingButtons.css'

type AttendingButtonsState = {
  loading: boolean
}

export type AttendingButtonsProps = {
  event: EventAttributes,
  onShareFallback?: (e: React.MouseEvent<any>, event: EventAttributes) => void
}

export default function AttendingButtons(props: AttendingButtonsProps) {

  const event: PublicEventAttributes = props.event as any
  const [state, patchState] = usePatchState<AttendingButtonsState>({ loading: false })
  const [profile, actions] = useProfile()
  const location = useLocation()
  const isMobile = useMobileDetector()
  const loading = actions.loading || state.loading

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
          const ethAddress = profile.address.toString() || null
          const newAttendees = await Events.get().setEventAttendee(event.id, !event.attending)
          const attendees = newAttendees.map(attendee => attendee.user)
          const newEvent = {
            ...event,
            attending: !event.attending,
            total_attendees: attendees.length,
            latest_attendees: attendees.slice(0, 10)
          }
          stores.event.setEntity(newEvent as any)

          track((analytics) => analytics.track(segment.Track.Going, { ethAddress }))
        }
      })
      .then(() => patchState({ loading: false }))
      .catch((err) => {
        console.error(err)
        patchState({ loading: false })
      })
  }

  function handleShare(e: React.MouseEvent<any>) {
    const ethAddress = profile?.address.toString() || null
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({
        title: event.name,
        text: event.description,
        url: location.origin + url.toEvent(location, event.id),
      })
        .then(() => track((analytics) => analytics.track(segment.Track.Share, { ethAddress, medium: 'native' })))

    } else if (props.onShareFallback) {
      e.preventDefault()
      e.stopPropagation()
      props.onShareFallback(e, props.event)
      track((analytics) => analytics.track(segment.Track.ShareFallback, { ethAddress }))
    }
  }

  return <div className="AttendingButtons">
    {(actions.provider || !isMobile) && <Button inverted size="small" onClick={handleAttend} loading={loading} disabled={loading || !event.approved} className={TokenList.join(['attending-status', event.attending && 'attending'])}>
      {event.attending && 'GOING'}
      {!event.attending && 'WANT TO GO'}
    </Button>}

    {(actions.provider || !isMobile) && <Button inverted primary size="small" className="share" disabled={loading || !event.approved} onClick={handleShare}>
      <img src={share} width="16" height="16" />
    </Button>}

    {!actions.provider && isMobile && <Button inverted primary size="small" className="share mobile" disabled={loading || !event.approved} onClick={handleShare}>
      <img src={share} width="16" height="16" /> SHARE
    </Button>}
  </div>
}