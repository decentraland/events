import React, { useMemo } from 'react';
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import Time from 'decentraland-gatsby/dist/utils/date/Time';
import { SessionEventAttributes } from '../../../entities/Event/types'
import './EventDate.css'

export type EventDateProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes
  utc?: boolean
}

export default React.memo(function EventDate({ event, utc, ...props }: EventDateProps) {
  utc = utc || false
  const now = useMemo(() => Time.from(Date.now(), { utc }), [ utc ])
  const start_at = useMemo(
    () => Time.from(event.next_start_at || now, { utc }),
    [ event.next_start_at, utc ]
  )

  const finish_at = useMemo(
    () => Time.from(start_at.getTime() + event.duration, { utc }),
    [ start_at, event.duration, utc ]
  )

  const description = useMemo(() => {
    if (now.isBetween(start_at, finish_at)) {
      return 'NOW'
    }

    if (start_at.isToday()) {
      return 'TODAY'
    }

    if (start_at.isTomorrow()) {
      return 'TOMORROW'
    }

    return start_at.format(`MMMM DD`)
  }, [ start_at, finish_at ])

  return <div {...props} className={TokenList.join(['EventDate', props.className])}>
    {description}
  </div>
})