import React from 'react'
import './Live.css'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'

export type LiveProps = {
  primary?: boolean,
  inverted?: boolean
}

export default function Live(props: LiveProps) {
  return <div className={TokenList.join(["Live", props.primary && 'primary', props.inverted && 'inverted'])}>LIVE</div>
}