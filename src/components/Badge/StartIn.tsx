import React from "react"

import useCountdown from "decentraland-gatsby/dist/hooks/useCountdown"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import Live from "./Live"
import useFormattedCountdown from "../../hooks/useFormattedCountdown"

import "./StartIn.css"

export type StartInProps = {
  date: Date
}

export default function StartIn(props: StartInProps) {
  const { countdown, countdownMessage } = useFormattedCountdown(props.date)

  if (countdown.time <= 0) {
    return <Live primary />
  }

  return (
    <div className={TokenList.join(["StartIn"])}>
      {countdownMessage}
    </div>
  )
}
