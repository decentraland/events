import React, { useEffect } from "react"

import track, {
  Tracker,
} from "decentraland-gatsby/dist/utils/development/segment"

export default function useAnalytics(
  tracker: Tracker,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    track(tracker)
  }, deps)
}
