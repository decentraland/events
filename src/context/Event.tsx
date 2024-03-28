import React, { createContext, useCallback, useContext, useMemo } from "react"

import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useAsyncTasks from "decentraland-gatsby/dist/hooks/useAsyncTasks"
import isUUID from "validator/lib/isUUID"

import Events from "../api/Events"
import { SessionEventAttributes } from "../entities/Event/types"
import { EventAttendeeAttributes } from "../entities/EventAttendee/types"
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfileSettingsAttributes,
} from "../entities/ProfileSettings/types"
import { canEditAnyEvent } from "../entities/ProfileSettings/utils"
import { SegmentEvent } from "../modules/segment"

const defaultProfileSettings = [
  [] as SessionEventAttributes[],
  {
    error: null as Error | null,
    loading: false as boolean,
    approving: [] as string[],
    rejecting: [] as string[],
    restoring: [] as string[],
    attending: [] as string[],
    modifying: new Set<string>(),
    reload: (() => null) as () => void,
    add: (() => null) as (newEvent: SessionEventAttributes) => void,
    approve: (() => null) as (id: string) => void,
    reject: (() => null) as (id: string) => void,
    restore: (() => null) as (id: string) => void,
    attend: (() => null) as (id: string, attending: boolean) => void,
  },
] as const

export function useEvents() {
  const track = useTrackContext()
  const [account, accountState] = useAuthContext()
  const [events, eventsState] = useAsyncMemo(
    async () => {
      if (accountState.loading) {
        return []
      }

      return Events.get().getEvents()
    },
    [account, accountState.loading],
    { initialValue: [] as SessionEventAttributes[] }
  )

  const add = useCallback(
    function (newEvent: SessionEventAttributes) {
      eventsState.set((events) => {
        let replaced = false
        const list = events.map((event) => {
          if (event.id === newEvent.id) {
            replaced = true
            return newEvent
          }

          return event
        })

        if (!replaced) {
          list.push(newEvent)
        }

        return list
      })
    },
    [eventsState]
  )

  const updateEventState = useCallback(
    async function (
      id: string,
      changes: Pick<SessionEventAttributes, "approved" | "rejected">
    ) {
      if (!account) {
        return accountState.select()
      }

      const newEvent = await Events.get().updateEvent(id as string, changes)
      track(SegmentEvent.EditEvent, { data: newEvent })
      add(newEvent)
    },
    [account, accountState, add, track]
  )

  const [approving, approve] = useAsyncTasks(
    (id) => updateEventState(id as string, { approved: true, rejected: false }),
    [updateEventState]
  )
  const [rejecting, reject] = useAsyncTasks(
    (id) => updateEventState(id as string, { approved: false, rejected: true }),
    [updateEventState]
  )
  const [restoring, restore] = useAsyncTasks(
    (id) =>
      updateEventState(id as string, { approved: false, rejected: false }),
    [updateEventState]
  )

  const updateAttendee = useCallback(
    async (
      id: string,
      updateAttendee: () => Promise<EventAttendeeAttributes[]>
    ) => {
      if (!account) {
        return accountState.select()
      }

      const event = events.find((event) => event.id === id)
      if (!event) {
        return
      }

      try {
        const newAttendees = await updateAttendee()
        const newAttendee = newAttendees.find(
          (attendee) => attendee.user === account
        )

        const newEvent = {
          ...event,
          attending: !!newAttendee,
          total_attendees: newAttendees.length,
          latest_attendees: newAttendees
            .slice(0, 10)
            .map((attendee) => attendee.user),
        }

        add(newEvent)
        track(SegmentEvent.Going, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
          attending: newEvent.attending,
        })
        return event
      } catch (error) {
        console.error(error)
        track(SegmentEvent.Error, {
          eventId: id,
          error: (error as any).message,
          ...(error as any),
        })
        throw error
      }
    },
    [account, accountState, events, add, track]
  )

  const [attending, attend] = useAsyncTasks(
    async (id, attending: boolean) => {
      await updateAttendee(id, () =>
        Events.get().setEventAttendee(id, attending)
      )
    },
    [updateAttendee]
  )

  const modifying = useMemo(
    () => new Set([...approving, ...rejecting, ...restoring, ...attending]),
    [approving, rejecting, restoring, attending]
  )

  return [
    events,
    {
      error: eventsState.error,
      loading: eventsState.loading,
      approving,
      rejecting,
      restoring,
      attending,
      modifying,
      reload: eventsState.reload,
      add,
      approve,
      reject,
      restore,
      attend,
    },
  ] as const
}

const EventsContext = createContext(defaultProfileSettings)

export default function EventsProvider(props: React.PropsWithChildren<{}>) {
  const events = useEvents()
  return (
    <EventsContext.Provider value={events}>
      {props.children}
    </EventsContext.Provider>
  )
}

export function useEventsContext() {
  return useContext(EventsContext)
}

export function useEventSorter(
  events: SessionEventAttributes[] = [],
  settings: ProfileSettingsAttributes = DEFAULT_PROFILE_SETTINGS
) {
  return useMemo(() => {
    const now = Date.now()
    return events
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
  }, [events, settings])
}

export function useEventSchedule(
  events: SessionEventAttributes[] = [],
  schedule: string | null
) {
  return useMemo(
    () =>
      events
        .filter((event) => {
          if (!event.schedules || !schedule) {
            return false
          }
          const eventSchedules = new Set(event.schedules)
          return eventSchedules.has(schedule)
        })
        .sort((a, b) => a.next_start_at.getTime() - b.next_start_at.getTime()),
    [events, schedule]
  )
}

export function useEventIdContext(eventId?: string | null) {
  const [events, state] = useContext(EventsContext)
  return useAsyncMemo(
    async () => {
      if (!eventId || !isUUID(eventId) || state.loading) {
        return null
      }

      const currentEvent = events.find((event) => event.id === eventId)
      if (currentEvent) {
        return currentEvent
      }

      return Events.get().getEventById(eventId)
    },
    [eventId, events, events.length, !state.loading],
    { callWithTruthyDeps: true }
  )
}
