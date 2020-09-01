import React from 'react'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
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

  return <div className={TokenList.join(["StartIn"])}>
    {countdown.days > 0 && `in ${countdown.days} ${countdown.days === 1 ? 'day' : 'days'}`}
    {countdown.days === 0 && countdown.hours > 0 && `in ${countdown.hours} ${countdown.hours === 1 ? 'hour' : 'hours'}`}
    {countdown.days === 0 && countdown.hours === 0 && countdown.minutes > 0 && `in ${countdown.minutes} ${countdown.minutes === 1 ? 'minute' : 'minutes'}`}
    {countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && `in less than a minute`}
  </div>
}