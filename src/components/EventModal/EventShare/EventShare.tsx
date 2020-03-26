import React from 'react'
import { EventAttributes } from '../../../entities/Event/types'

import './EventShare.css'
import { navigate } from 'gatsby'
import { useLocation } from '@reach/router'
import SubTitle from 'decentraland-gatsby/dist/components/Text/SubTitle'
import url from '../../../url'
import { Button } from 'decentraland-ui/dist/components/Button/Button'

const back = require('../../../images/back.svg')

export type EventShareProps = {
  event: EventAttributes
}

export default function EventShare(props: EventShareProps) {

  const location = useLocation()

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
    params.set('u', url.toEvent(location, props.event.id))

    if (props.event.description) {
      params.set('description', props.event.description)
    }

    share('https://www.facebook.com/sharer/sharer.php?' + params.toString())

    // `https://twitter.com/intent/tweet?text=Just added a new design to Decentraland via the Builder. Check it out below then create your own. The virtual world’s not gonna build itself you know! {url}&hashtags=builder,virtualworld,gaming`
  }

  function handleShareTwitter(e: React.MouseEvent<any>) {
    e.preventDefault()

    const params = new URLSearchParams()

    if (props.event.description) {

    } else {

    }
    params.set('text', url.toEvent(location, props.event.id))

    if (props.event.description) {
      params.set('description', props.event.description)
    }

    params.set('hashtags', 'builder,virtualworld,gaming')

    share('https://twitter.com/intent/tweet?' + params.toString())
    // `https://www.facebook.com/sharer/sharer.php?u={url}&description=${props.event.description}`
    // `https://twitter.com/intent/tweet?text=Just added a new design to Decentraland via the Builder. Check it out below then create your own. The virtual world’s not gonna build itself you know! {url}&hashtags=builder,virtualworld,gaming`
  }

  return <div className="EventShare">
    <div className="EventShare__Header">
      <img src={back} width="8" height="16" onClick={() => navigate(url.toEvent(location, props.event.id))} />
      <SubTitle>Share Event</SubTitle>
    </div>
    <div className="EventShare__Body">
      <Button inverted primary onClick={handleShareFacebook} >facebook</Button>
      <Button inverted primary onClick={handleShareTwitter}>twitter</Button>
    </div>
  </div>
}