import { useMemo } from "react"

import { SessionEventAttributes } from "../entities/Event/types"

export default function useListEventsTrending(
  events?: SessionEventAttributes[] | null
) {
  return useMemo(
    () => (events ? events.filter((event) => !!event.trending) : []),
    [events]
  )
}
