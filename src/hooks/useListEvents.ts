import { SessionEventAttributes } from "../entities/Event/types"
import { useMemo } from "react"
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfileSettingsAttributes,
} from "../entities/ProfileSettings/types"
import { canEditAnyEvent } from "../entities/ProfileSettings/utils"

export default function useListEvents(
  events?: Record<string, SessionEventAttributes>,
  settings: ProfileSettingsAttributes = DEFAULT_PROFILE_SETTINGS
) {
  return useMemo(() => {
    if (!events) {
      return []
    }

    const now = Date.now()
    return Object.values(events)
      .filter((event) => {
        if (event.rejected) {
          return false
        }

        if (
          !event.approved &&
          event.user !== settings.user &&
          !canEditAnyEvent(settings)
        ) {
          return false
        }

        if (event.finish_at.getTime() < now) {
          return false
        }

        return true
      })
      .sort((a, b) => a.next_start_at.getTime() - b.next_start_at.getTime())
  }, [events])
}
