import React from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import useMobileDetector from 'decentraland-gatsby/dist/hooks/useMobileDetector'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import track from 'decentraland-gatsby/dist/components/Segment/track'
import { SessionEventAttributes } from '../../entities/Event/types'
import Events from '../../api/Events'
import { useLocation } from '@reach/router'
import url from '../../utils/url'
import * as segment from '../../utils/segment'

const share = require('../../images/share.svg')
const close = require('../../images/popup-close.svg')
const facebook = require('../../images/icon-facebook.svg')
const twitter = require('../../images/icon-twitter.svg')

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

    const params = new URLSearchParams([
      ['u', location.origin + url.toEvent(location, props.event.id)]
    ])

    if (props.event.description) {
      params.set('description', props.event.description)
    }

    track((analytics) => analytics.track(segment.Track.Share, { ethAddress, event: event?.id || null, medium: 'facebook' }))
    handleFallbackShare(`https://www.facebook.com/sharer/sharer.php?` + params.toString())
  }

  function handleShareTwitter(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    const params = new URLSearchParams([
      ['hashtags', 'decentraland,socialworld,virtualgames']
    ])

    if (props.event.description) {
      params.set('text', props.event.description + ' ' + location.origin + url.toEvent(location, props.event.id))
    } else {
      params.set('text', location.origin + url.toEvent(location, props.event.id))
    }

    track((analytics) => analytics.track(segment.Track.Share, { ethAddress, event: event?.id || null, medium: 'twitter' }))
    handleFallbackShare('https://twitter.com/intent/tweet?' + params.toString())
  }

  function handleAttend(e: React.MouseEvent<any>) {
    e.preventDefault()
    e.stopPropagation()

    if (props.loading || !props.onChangeEvent) {
      return
    }

    props.onChangeEvent(e, { ...event, attending: !event.attending })
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
      {(actions.provider || !isMobile) && <Button inverted size="small" onClick={handleAttend} loading={loading} disabled={loading || !event.approved} className={TokenList.join(['attending-status', 'fluid', event.attending && 'attending'])}>
        {event.attending && 'GOING'}
        {!event.attending && 'WANT TO GO'}
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