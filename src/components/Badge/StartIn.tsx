import React from 'react'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import useCountdown from 'decentraland-gatsby/dist/hooks/useCountdown'
import Live from './Live'
import './StartIn.css'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'

export type StartInProps = {
  date: Date
}

export default function StartIn(props: StartInProps) {
  const countdown = useCountdown(props.date)

  if (countdown.time <= 0) {
    return <Live primary />
  }

  const days = countdown.days
  const hours = countdown.hours
  const minutes = countdown.minutes

  return <div className={TokenList.join(["StartIn"])}>
    {days > 0 && `in ${days} ${days === 1 ? 'day' : 'days'}`}
    {days === 0 && hours > 0 && `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`}
    {days === 0 && hours === 0 && minutes > 0 && `in ${minutes + 1} ${(minutes + 1) === 1 ? 'minute' : 'minutes'}`}
    {days === 0 && hours === 0 && minutes === 0 && `in less than a minute`}
  </div>
}