import React from 'react'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import './Live.css'

export type LiveProps = {
  primary?: boolean,
  inverted?: boolean
}

export default function Live(props: LiveProps) {
  return <div className={TokenList.join(["Live", props.primary && 'primary', props.inverted && 'inverted'])}>LIVE</div>
}