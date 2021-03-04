import { useLocation } from "@reach/router"
import { ChainId } from '@dcl/schemas';
import { ProviderType } from "decentraland-connect/dist/types"
import useStore from "decentraland-gatsby/dist/hooks/useStore"
import EntityStore, { EntityStoreState } from "decentraland-gatsby/dist/utils/EntityStore"
import useAuth from "decentraland-gatsby/dist/hooks/useAuth"
import API from "decentraland-gatsby/dist/utils/api/API"
import isUUID from "validator/lib/isUUID"
import { SessionEventAttributes } from "../entities/Event/types"
import url from "../utils/url"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"
import Events, { EditEvent } from "../api/Events"
import { Realm } from "../entities/Realm/types"
import track from "decentraland-gatsby/dist/utils/segment/segment"
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
  const [address, actions] = useAuth()
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
    if (!address && settings) {
      setProfileSettings(null)
    } else if (address && (!settings || address !== settings.user)) {
      const newSettings = await API.catch(Events.get().getMyProfileSettings())
      setProfileSettings(newSettings)
    }
  }, [address, actions.loading])

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
  }, [address, actions.loading])

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
        profile: address,
        events: events.getState(),
        realms: realms.getState(),
        ...extraState,
      },
      replace
    }
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

  async function createEvent(data: EditEvent) {
    if (!address) {
      return null
    }

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
    if (!address) {
      return null
    }

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
    if (!address) {
      return null
    }

    const event = events.getEntity(eventId)

    try {
      const newAttendees = await edit()
      const ethAddress = address
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

  function connect(providerType: ProviderType, chainId: ChainId = ChainId.ETHEREUM_MAINNET) {
    return actions.connect(providerType, chainId)
  }

  return {
    profile: address,
    settings,
    updateSettings,
    updateSubscription,

    connect,

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
