import { useMemo } from "react"

import useCountdown, {
  Countdown,
} from "decentraland-gatsby/dist/hooks/useCountdown"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

export type FormattedCountdown = {
  countdown: Countdown
  countdownMessage: string
}

export default function useFormattedCountdown(
  until: Pick<Date, "getTime">
): FormattedCountdown {
  const countdown = useCountdown(until)
  const l = useFormatMessage()

  const days = countdown.days
  const hours = countdown.hours
  const minutes = countdown.minutes

  const countdownMessage = useMemo(() => {
    if (days > 0) {
      return `in ${days} ${
        days === 1
          ? l("components.badge.start_in.day")
          : l("components.badge.start_in.days")
      }`
    }
    if (hours > 0) {
      return `in ${hours} ${
        hours === 1
          ? l("components.badge.start_in.hour")
          : l("components.badge.start_in.hours")
      }`
    }
    if (minutes > 0) {
      return `in ${minutes} ${
        minutes === 1
          ? l("components.badge.start_in.minute")
          : l("components.badge.start_in.minutes")
      }`
    }
    return l("components.badge.start_in.in_less_than_a_minute")
  }, [days, hours, minutes, l])

  return {
    countdown,
    countdownMessage,
  }
}
