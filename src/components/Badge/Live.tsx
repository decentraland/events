import React from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import "./Live.css"

export type LiveProps = {
  primary?: boolean
  inverted?: boolean
}

export default function Live(props: LiveProps) {
  const l = useFormatMessage()
  return (
    <div
      className={TokenList.join([
        "Live",
        props.primary && "primary",
        props.inverted && "inverted",
      ])}
    >
      {l("components.badge.live")}
    </div>
  )
}
