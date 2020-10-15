import React, { useMemo } from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import useMobileDetector from 'decentraland-gatsby/dist/hooks/useMobileDetector'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import track from 'decentraland-gatsby/dist/components/Segment/track'
import { SessionEventAttributes } from '../../entities/Event/types'
import { eventTwitterUrl, eventFacebookUrl, eventTargetUrl } from '../../entities/Event/utils'
import { useLocation } from '@reach/router'
import url from '../../utils/url'
import * as segment from '../../utils/segment'

const share = require('../../images/share.svg')
const close = require('../../images/popup-close.svg')
const facebook = require('../../images/icon-facebook.svg')
const twitter = require('../../images/icon-twitter.svg')
const notificationDisabled = require('../../images/notification-disabled.svg')
const notificationEnabled = require('../../images/notification-enabled.svg')
const primaryJumpIn = require('../../images/primary-jump-in.svg')

import './AttendingButtons.css'

type AttendingButtonsState = {
  sharing: boolean
}

export type AttendingButtonsProps = {
  loading?: boolean,
  event: SessionEventAttributes,
  onChangeEvent?: (e: React.MouseEvent<any>, event: SessionEventAttributes) => void
  onShareFallback?: (e: React.MouseEvent<any>, event: SessionEventAttributes) => void
}

export default function AttendingButtons(props: AttendingButtonsProps) {

  const event: SessionEventAttributes = props.event
  const [state, patchState] = usePatchState<AttendingButtonsState>({ sharing: false })
  const [profile, actions] = useProfile()
  const location = useLocation()
  const isMobile = useMobileDetector()
  const ethAddress = profile?.address.toString() || null
  const loading = props.loading
  const href = useMemo(() => eventTargetUrl(event), [ event ])

  function handleFallbackShare(url: string) {
    const width = 600
    const height = 250
    const top = Math.ceil(window.outerHeight / 2 - height / 2)
    const left = Math.ceil(window.outerWidth / 2 - width / 2)
    window.open(
      url,
      'sharer',
      `toolbar=no,location=0,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
    )
  }

  function handleShareFacebook(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()
    track((analytics) => analytics.track(segment.Track.Share, { ethAddress, event: event?.id || null, medium: 'facebook' }))
    handleFallbackShare(eventFacebookUrl(event))
  }

  function handleShareTwitter(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()
    track((analytics) => analytics.track(segment.Track.Share, { ethAddress, event: event?.id || null, medium: 'twitter' }))
    handleFallbackShare(eventTwitterUrl(event))
  }

  function handleAttend(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (props.loading || !props.onChangeEvent) {
      return
    }

    props.onChangeEvent(e, { ...event, attending: !event.attending })
  }

  function handleNotify(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (props.loading || !props.onChangeEvent) {
      return
    }

    props.onChangeEvent(e, { ...event, notify: !event.notify })
  }

  function handleShare(e: React.MouseEvent<any>) {
    const ethAddress = profile?.address.toString() || null
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({
        title: event.name,
        text: event.description,
        url: location.origin + url.toEvent(location, event.id),
      })
        .then(() => track((analytics) => analytics.track(segment.Track.Share, { ethAddress, event: event?.id || null, medium: 'native' })))
        .catch((err: Error) => console.error(err))

    } else {
      e.preventDefault()
      e.stopPropagation()
      track((analytics) => analytics.track(segment.Track.ShareFallback, { ethAddress, event: event?.id || null }))
      patchState({ sharing: true })
    }
  }

  function handleCancelShare(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()
    patchState({ sharing: false })
  }

  function handlePropagation(e: React.MouseEvent<any>) {
    e.stopPropagation()
  }

  return <div className="AttendingButtons">
    {state.sharing && <>
      <Button inverted size="small" className="share fluid" onClick={handleShareFacebook}>
        <img src={facebook} width="10" height="16" />
      </Button>
      <Button inverted size="small" className="share fluid" onClick={handleShareTwitter}>
        <img src={twitter} width="18" height="15" />
      </Button>
      <Button inverted size="small" className="share" onClick={handleCancelShare}>
        <img src={close} width="14" height="14" />
      </Button>
    </>}

    {!state.sharing && <>
      {event.live && (actions.provider || !isMobile) && <Button primary size="small" disabled={loading || !event.approved} onClick={handlePropagation} className="fluid" href={href} target="_blank" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span>JUMP IN</span>
        <img src={primaryJumpIn} width={14} height={14} style={{ marginLeft: '.5rem' }} />
      </Button>}

      {!event.live && (actions.provider || !isMobile) && <Button inverted size="small" onClick={handleAttend} loading={loading} disabled={loading || !event.approved} className={TokenList.join(['attending-status', 'fluid', event.attending && 'attending'])}>
        {event.attending && 'GOING'}
        {!event.attending && 'WANT TO GO'}
      </Button>}

      {!event.live && event.attending && (actions.provider || !isMobile) && <Button inverted primary size="small" className="share" disabled={loading || !event.approved} onClick={handleNotify}>
        <img src={event.notify && notificationEnabled || notificationDisabled} width="22" height="22" />
      </Button>}

      {(actions.provider || !isMobile) && <Button inverted primary size="small" className="share" disabled={loading || !event.approved} onClick={handleShare}>
        <img src={share} width="14" height="14" />
      </Button>}

      {!actions.provider && isMobile && <Button inverted primary size="small" className="share fluid" disabled={loading || !event.approved} onClick={handleShare}>
        <img src={share} width="14" height="14" /> SHARE
    </Button>}
    </>}
  </div>
}