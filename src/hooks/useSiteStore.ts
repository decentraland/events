import { useLocation } from "@reach/router"
import useStore from "decentraland-gatsby/dist/hooks/useStore"
import EntityStore, { EntityStoreState } from "decentraland-gatsby/dist/utils/EntityStore"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import API from "decentraland-gatsby/dist/utils/api/API"
import isUUID from "validator/lib/isUUID"
import { SessionEventAttributes } from "../entities/Event/types"
import url from "../utils/url"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import Events, { EditEvent } from "../api/Events"
import { Realm } from "../entities/Realm/types"
import track from "decentraland-gatsby/dist/components/Segment/track"
import * as segment from '../utils/segment'
import { useEffect, useState } from "react"
import { ProfileSettingsAttributes } from "../entities/ProfileSettings/types"
import { EventAttendeeAttributes } from "../entities/EventAttendee/types"


export type SiteStore = {
  events?: EntityStore<SessionEventAttributes>
  realms?: EntityStore<Realm>
}

export type SiteState = {
  loading?: boolean
  profile?: string | null,
  settings?: ProfileSettingsAttributes | null
  events?: Partial<EntityStoreState<SessionEventAttributes>>
  realms?: Partial<EntityStoreState<Realm>>
}

export type SiteLocationState = {
  state?: SiteState
  replace?: boolean
}

export default function useSiteStore(siteInitialState: SiteLocationState = {}) {

  const location = useLocation()
  const eventId = url.getEventId(location)
  const [profile, actions] = useProfile()
  const events = useStore<SessionEventAttributes>(siteInitialState?.state?.events, [siteInitialState?.state?.events])
  const event = eventId && isUUID(eventId) && events.getEntity(eventId) || null
  const realms = useStore<Realm>(siteInitialState?.state?.realms, [siteInitialState?.state?.events])
  const [settings, setProfileSettings] = useState<ProfileSettingsAttributes | null>(siteInitialState?.state?.settings || null)

  useEffect(() => {
    if (window.history) {
      window.history.replaceState(getNavigationState(), document.title)
    }
  }, [events.getState().data, realms.getState().data])

  useAsyncEffect(async () => {
    if (!profile && settings) {
      setProfileSettings(null)
    } else if (profile && (!settings || profile.address.toString().toLowerCase() !== settings.user)) {
      const newSettings = await API.catch(Events.get().getMyProfileSettings())
      setProfileSettings(newSettings)
    }
  }, [profile, actions.loading])

  useAsyncEffect(async () => {
    if (actions.loading || events.isLoading() || events.getList()) {
      return
    }

    events.setLoading()
    events.clear()

    const newEvents = await API.catch(Events.get().getEvents())
    const loadedEvents = newEvents || []
    events.setEntities(loadedEvents)

    if (eventId && isUUID(eventId || '') && !loadedEvents.find(event => event.id === eventId)) {
      const event = await API.catch(Events.get().getEventById(eventId))
      if (event) {
        loadedEvents.push(event)
      }
    }

    events.setEntities(loadedEvents)
    events.setLoading(false)
  }, [profile, actions.loading])

  useAsyncEffect(async () => {
    if (realms.getList()) {
      return
    }

    realms.setLoading()
    const newRealms = await API.catch(Events.get().getRealms())
    realms.setEntities(newRealms || [])
    realms.setLoading(false)
  }, [])

  function getNavigationState(extraState: Record<string, any> = {}, replace: boolean = false): SiteLocationState {
    return {
      state: {
        settings: settings,
        profile: profile ? profile.address.toString().toLowerCase() : null,
        events: events.getState(),
        realms: realms.getState(),
        ...extraState,
      },
      replace
    }
  }

  async function updateSettings(updateSettings: Partial<ProfileSettingsAttributes>) {
    track((analytics) => analytics.track(segment.Track.Settings, { settings: { 
      ...settings,
      ...updateSettings
    }}))
    const newSettings = await API.catch(Events.get().updateProfileSettings(updateSettings))
    if (newSettings) {
      setProfileSettings(newSettings)
    }
    return newSettings
  }

  async function updateSubscription(options: { endpoint: string, p256dh: string, auth: string } | null) {
    if (options) {
      await API.catch(Events.get().createSubscription(options))
    } else {
      await API.catch(Events.get().removeSubscriptions())
    }

    const newSettings = await API.catch(Events.get().getMyProfileSettings())
    setProfileSettings(newSettings)
  }

  async function createEvent(data: EditEvent) {
    profile || await actions.connect()

    try {
      const newEvent = await Events.get().createEvent(data)
      track((analytics) => analytics.track(segment.Track.NewEvent, { event: newEvent }))
      events.setEntity(newEvent)
      return Promise.resolve(newEvent)
    } catch (error) {
      console.error(error)
      track((analytics) => analytics.track(segment.Track.Error, { error: error.message, post: data, ...error }))
      return Promise.reject(error)
    }
  }

  async function updateEvent(eventId: string, data: Partial<EditEvent> = {}) {
    profile || await actions.connect()

    try {
      const newEvent = await Events.get().updateEvent(eventId, data)
      track((analytics) => analytics.track(segment.Track.EditEvent, { event: newEvent }))
      events.setEntity(newEvent)
      return Promise.resolve(newEvent)
    } catch (error) {
      console.error(error)
      track((analytics) => analytics.track(segment.Track.Error, { error: error.message, post: data, ...error }))
      return Promise.reject(error)
    }
  }

  async function editAttendingEvent(eventId: string, edit: () => Promise<EventAttendeeAttributes[]>) {
    profile || await actions.connect()
    const event = events.getEntity(eventId)

    try {
      const newAttendees = await edit()
      const ethAddress = profile && profile.address.toString().toLowerCase()
      let newAttendee: EventAttendeeAttributes | null = null
      const attendees: string[] = []
      for (const attendee of newAttendees) {
        attendees.push(attendee.user)
        if (attendee.user === ethAddress) {
          newAttendee = attendee
        }
      }

      const newEvent = {
        ...event,
        attending: !!newAttendee,
        notify: !!(newAttendee && newAttendee.notify),
        total_attendees: attendees.length,
        latest_attendees: attendees.slice(0, 10)
      }

      events.setEntity(newEvent as any)
      track((analytics) => analytics.track(segment.Track.Going, { ethAddress, event: event?.id || null }))
      return Promise.resolve(event)

    } catch (error) {
      console.error(error)
      track((analytics) => analytics.track(segment.Track.Error, { error: error.message, eventId, ...error }))
      return Promise.reject(error)
    }
  }

  async function attendEvent(eventId: string, value: boolean = true) {
    return editAttendingEvent(eventId, () => Events.get().setEventAttendee(eventId, value))
  }

  async function notifyEvent(eventId: string, notify: boolean = true) {
    return editAttendingEvent(eventId, () => Events.get().updateEventAttendee(eventId, { notify }))
  }

  function connect() {
    return actions.connect()
  }

  return {
    profile,
    settings,
    updateSettings,
    updateSubscription,

    connect,
    connectError: actions.error && actions.error.code,


    event,
    events,
    updateEvent,
    createEvent,
    attendEvent,
    notifyEvent,

    realms,

    loading: actions.loading || events.isLoading() || realms.isLoading(),
    getNavigationState
  }
}

