import { useMemo } from "react"

import { SessionEventAttributes } from "events-type/src/types/Event"

export default function useListEventsTrending(
  events?: SessionEventAttributes[] | null
) {
  return useMemo(
    () => (events ? events.filter((event) => !!event.trending) : []),
    [events]
  )
}
