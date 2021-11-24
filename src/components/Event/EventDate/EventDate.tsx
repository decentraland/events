import React, { useMemo } from "react"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { SessionEventAttributes } from "../../../entities/Event/types"
import "./EventDate.css"
import { useProfileSettingsContext } from "../../../context/ProfileSetting"

export type EventDateProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes
  utc?: boolean
}

export default React.memo(function EventDate({
  event,
  utc,
  ...props
}: EventDateProps) {
  const [settings] = useProfileSettingsContext()
  const now = useMemo(
    () => Time.from(Date.now(), { utc: utc ?? !settings?.use_local_time }),
    [utc, settings?.use_local_time]
  )
  const start_at = useMemo(
    () =>
      Time.from(event.next_start_at || now, {
        utc: utc ?? !settings?.use_local_time,
      }),
    [event.next_start_at, utc, settings]
  )

  const finish_at = useMemo(
    () =>
      Time.from(start_at.getTime() + event.duration, {
        utc: utc ?? !settings?.use_local_time,
      }),
    [start_at, event.duration, utc, settings]
  )

  const description = useMemo(() => {
    if (now.isBetween(start_at, finish_at)) {
      return "NOW"
    }

    if (start_at.isToday()) {
      return "TODAY"
    }

    if (start_at.isTomorrow()) {
      return "TOMORROW"
    }

    return start_at.format(`MMMM DD`)
  }, [start_at, finish_at])

  return (
    <div {...props} className={TokenList.join(["EventDate", props.className])}>
      {description}
    </div>
  )
})
