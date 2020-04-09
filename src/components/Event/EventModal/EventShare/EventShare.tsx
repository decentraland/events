import React from 'react'

import { navigate } from 'gatsby'
import { useLocation } from '@reach/router'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import track from 'decentraland-gatsby/dist/components/Segment/track'
import useProfile from 'decentraland-gatsby/dist/hooks/useProfile'

import { EventAttributes } from '../../../../entities/Event/types'
import url from '../../../../utils/url'
import * as segment from '../../../../utils/segment'

import './EventShare.css'

const back = require('../../../../images/back.svg')

export type EventShareProps = {
  event: EventAttributes
}

export default function EventShare(props: EventShareProps) {

  const location = useLocation()
  const [profile] = useProfile()

  const ethAddress = profile?.address.toString() || null

  function share(url: string) {
    const width = 600
    const height = 250
    const top = Math.ceil(window.outerHeight / 2 - height / 2)
    const left = Math.ceil(window.outerWidth / 2 - width / 2)
    window.open(
      url,
      'targetWindow',
      `toolbar=no,location=0,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
    )
  }

  function handleShareFacebook(e: React.MouseEvent<any>) {
    e.preventDefault()

    const params = new URLSearchParams()
    params.set('u', location.origin + url.toEvent(location, props.event.id))

    if (props.event.description) {
      params.set('description', props.event.description)
    }

    track((analytics) => analytics.track(segment.Track.Share, { ethAddress, medium: 'facebook' }))
    share('https://www.facebook.com/sharer/sharer.php?' + params.toString())
  }

  function handleShareTwitter(e: React.MouseEvent<any>) {
    e.preventDefault()

    const params = new URLSearchParams()

    if (props.event.description) {
      params.set('text', props.event.description + ' ' + location.origin + url.toEvent(location, props.event.id))
    } else {
      params.set('text', location.origin + url.toEvent(location, props.event.id))
    }

    params.set('hashtags', 'decentraland,socialworld,virtualgames')

    track((analytics) => analytics.track(segment.Track.Share, { ethAddress, medium: 'twitter' }))
    share('https://twitter.com/intent/tweet?' + params.toString())
  }

  return <div className="EventShare">
    <div className="EventShare__Header">
      <img src={back} width="8" height="16" onClick={() => navigate(url.toEvent(location, props.event.id))} />
      <SubTitle>Share Event</SubTitle>
    </div>
    <div className="EventShare__Body">
      <Button inverted primary onClick={handleShareFacebook} >Facebook</Button>
      <Button inverted primary onClick={handleShareTwitter}>Twitter</Button>
    </div>
  </div>
}
