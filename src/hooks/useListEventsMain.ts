import { useMemo } from "react"

import { SessionEventAttributes } from "../entities/Event/types"

export default function useListEventsMain(
  events?: SessionEventAttributes[] | null
) {
  const now = useMemo(() => Date.now(), [])
  return useMemo(
    () =>
      events
        ? events
            .filter(
              (event) =>
                event.approved &&
                event.highlighted &&
                event.finish_at.getTime() > now
            )
            .sort((eventA, eventB) => {
              return (
                Math.abs(now - eventA.next_start_at.getTime()) -
                Math.abs(now - eventB.next_start_at.getTime())
              )
            })
        : [],
    [events]
  )
}
