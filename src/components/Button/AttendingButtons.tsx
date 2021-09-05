import React, { useMemo, useState } from 'react'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import useMobileDetector from 'decentraland-gatsby/dist/hooks/useMobileDetector'
import useTimeout from 'decentraland-gatsby/dist/hooks/useTimeout'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import track from 'decentraland-gatsby/dist/utils/development/segment'
import newPopupWindow from 'decentraland-gatsby/dist/utils/dom/newPopupWindow'
import { SessionEventAttributes } from '../../entities/Event/types'
import { eventTwitterUrl, eventFacebookUrl, eventTargetUrl } from '../../entities/Event/utils'
import { useLocation } from '@reach/router'
import { SegmentEvent } from '../../modules/segment'

const icons = {
  share: require('../../images/share.svg'),
  close: require('../../images/popup-close.svg'),
  facebook: require('../../images/icon-facebook.svg'),
  twitter: require('../../images/icon-twitter.svg'),
  notificationDisabled: require('../../images/notification-disabled.svg'),
  notificationEnabled: require('../../images/notification-enabled.svg'),
  primaryJumpIn: require('../../images/primary-jump-in.svg'),
}

import './AttendingButtons.css'
import { useEvents, useEventsContext } from '../../context/Event'
import prevent from 'decentraland-gatsby/dist/utils/react/prevent'
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'
import useAsyncTask from 'decentraland-gatsby/dist/hooks/useAsyncTask'
import locations from '../../modules/locations'

type AttendingButtonsState = {
  sharing: boolean
}

export type AttendingButtonsProps = {
  loading?: boolean,
  event: SessionEventAttributes
}

export default function AttendingButtons(props: AttendingButtonsProps) {
  const event: SessionEventAttributes = props.event
  const nextStartAt = useMemo(() => new Date(Date.parse(event.next_start_at.toString())), [event.next_start_at])
  const isLive = useTimeout(() => true, nextStartAt)
  const [fallbackShare, setFallbackShare] = useState(false)
  const [address, actions] = useAuthContext()
  const location = useLocation()
  const isMobile = useMobileDetector()
  const [ all, state ] = useEventsContext()
  const ethAddress = address
  const loading = useMemo(() => props.loading ?? state.modifying.has(event.id), [ props.loading, state.modifying ])
  const href = useMemo(() => eventTargetUrl(event), [ event ])

  function handleShareFacebook(e: React.MouseEvent<any>) {
    track((analytics) => analytics.track(SegmentEvent.Share, { ethAddress, event: event?.id || null, medium: 'facebook' }))
    newPopupWindow(eventFacebookUrl(event))
  }

  function handleShareTwitter(e: React.MouseEvent<any>) {
    track((analytics) => analytics.track(SegmentEvent.Share, { ethAddress, event: event?.id || null, medium: 'twitter' }))
    newPopupWindow(eventTwitterUrl(event))
  }

  const [ sharing, share ] = useAsyncTask(async () => {
    try {
      await (navigator as any).share({
        title: event.name,
        text: event.description,
        url: location.origin + locations.event(event.id),
      })
    } catch (err) {
      console.error(err)
    }
  })

  const handleShare = prevent(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      share()
    } else {
      track((analytics) => analytics.track(SegmentEvent.ShareFallback, { ethAddress, event: event?.id || null }))
      setFallbackShare(true)
    }
  })

  return <div className="AttendingButtons">
    {fallbackShare && <>
      <Button inverted size="small" className="share fluid" onClick={prevent(handleShareFacebook)}>
        <img src={icons.facebook} width="10" height="16" />
      </Button>
      <Button inverted size="small" className="share fluid" onClick={prevent(handleShareTwitter)}>
        <img src={icons.twitter} width="18" height="15" />
      </Button>
      <Button inverted size="small" className="share" onClick={prevent(() => setFallbackShare(false))}>
        <img src={icons.close} width="14" height="14" />
      </Button>
    </>}

    {!fallbackShare && <>
      {isLive && (actions.provider || !isMobile) && <Button primary size="small" disabled={loading || sharing || !event.approved} onClick={(e) => e.stopPropagation()} className="fluid" href={href} target="_blank" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span>JUMP IN</span>
        <img src={icons.primaryJumpIn} width={14} height={14} style={{ marginLeft: '.5rem' }} />
      </Button>}

      {!isLive && (actions.provider || !isMobile) && <Button inverted size="small" onClick={prevent(() => state.attend(event.id, !event.attending))} loading={loading} disabled={loading || sharing || !event.approved} className={TokenList.join(['attending-status', 'fluid', event.attending && 'attending'])}>
        {event.attending && 'GOING'}
        {!event.attending && 'WANT TO GO'}
      </Button>}

      {!isLive && event.attending && (actions.provider || !isMobile) && <Button inverted primary size="small" className="share" disabled={loading || sharing || !event.approved} onClick={prevent(() => state.notify(event.id, !event.notify))}>
        <img src={event.notify && icons.notificationEnabled || icons.notificationDisabled} width="22" height="22" />
      </Button>}

      {(actions.provider || !isMobile) && <Button inverted primary size="small" className="share" disabled={loading || sharing || !event.approved} onClick={handleShare}>
        <img src={icons.share} width="14" height="14" />
      </Button>}

      {!actions.provider && isMobile && <Button inverted primary size="small" className="share fluid" disabled={loading || sharing || !event.approved} onClick={handleShare}>
        <img src={icons.share} width="14" height="14" /> SHARE
    </Button>}
    </>}
  </div>
}