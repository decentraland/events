import API from 'decentraland-gatsby/dist/utils/api/API'
import env from 'decentraland-gatsby/dist/utils/env'
import Options from './Options'
import { EventAttributes, SessionEventAttributes } from '../entities/Event/types'
import { RequestOptions } from 'decentraland-gatsby/dist/utils/api/Options'
import { EventAttendeeAttributes } from '../entities/EventAttendee/types'
import { PosterAttributes } from '../entities/Poster/types'
import { Realm } from '../entities/Realm/types'
import { ProfileSettingsAttributes } from '../entities/ProfileSettings/types'

export type EditEvent = Pick<EventAttributes,
  'name' |
  'image' |
  'description' |
  'start_at' |
  'duration' |
  'all_day' |
  'x' |
  'y' |
  'realm' |
  'url' |
  'approved' |
  'rejected' |
  'highlighted' |
  'trending' |
  'recurrent' |
  'recurrent_count' |
  'recurrent_frequency' |
  'recurrent_interval' |
  'recurrent_month_mask' |
  'recurrent_weekday_mask' |
  'recurrent_setpos' |
  'recurrent_monthday' |
  'recurrent_until' |
  'contact' |
  'details'
>

export default class Events extends API {

  static Url = process.env.GATSBY_EVENTS_URL || `https://events.decentraland.org/api`

  static Cache = new Map<string, Events>()

  static from(url: string) {
    if (!this.Cache.has(url)) {
      this.Cache.set(url, new Events(url))
    }

    return this.Cache.get(url)!
  }

  static get() {
    return this.from(env('EVENTS_URL', this.Url))
  }

  static parse(event: Record<string, any>): SessionEventAttributes {

    const start_at = event.start_at && new Date(Date.parse(event.start_at.toString()))
    const next_start_at = event.next_start_at && new Date(Date.parse(event.next_start_at.toString()))
    const finish_at = event.finish_at && new Date(Date.parse(event.finish_at.toString()))
    const created_at = event.created_at && new Date(Date.parse(event.created_at.toString()))
    const updated_at = event.updated_at && new Date(Date.parse(event.updated_at.toString()))
    const recurrent_until = event.recurrent_until && new Date(Date.parse(event.recurrent_until.toString()))
    const duration = Number(event.duration) || finish_at.getTime() - start_at.getTime()
    const recurrent_dates = Array.isArray(event.recurrent_dates) && event.recurrent_dates.length > 0 ?
      event.recurrent_dates.map(date => new Date(Date.parse(date.toString()))) : [start_at]

    return {
      ...event,
      start_at,
      next_start_at,
      finish_at,
      created_at,
      updated_at,
      recurrent_until,
      recurrent_dates,
      duration,
      recurrent: Boolean(event.recurrent),
      attending: Boolean(event.attending),
      notify: Boolean(event.notify),
      editable: Boolean(event.editable),
      owned: Boolean(event.owned),
      live: Boolean(event.live),
    } as SessionEventAttributes
  }

  options(options: RequestOptions = {}) {
    return new Options(options)
  }

  async fetch<T extends object>(url: string, options: Options = new Options({})) {
    const result = await super.fetch<{ ok: boolean, data: T }>(url, options)
    return result.data
  }

  async fetchOne(url: string, options: Options = new Options({})): Promise<SessionEventAttributes> {
    const result = await this.fetch(url, options) as any
    return Events.parse(result)
  }

  async fetchMany(url: string, options: Options = new Options({})): Promise<SessionEventAttributes[]> {
    const result = await this.fetch(url, options) as any
    return (result || []).map(Events.parse)
  }

  async createSubscription(subscription: { endpoint: string, p256dh: string, auth: string }) {
    return this.fetch<{}>(
      '/profile/subscription',
      this.options()
        .authorization()
        .json(subscription)
        .method('POST')
    )
  }

  async removeSubscriptions() {
    return this.fetch<{}>(
      '/profile/subscription',
      this.options()
        .authorization()
        .method('DELETE')
    )
  }

  async getMyProfileSettings() {
    return this.fetch<ProfileSettingsAttributes>(
      '/profile/settings',
      this.options()
        .authorization()
    )
  }

  async updateProfileSettings(settings: Partial<ProfileSettingsAttributes> = {}) {
    return this.fetch<ProfileSettingsAttributes>(
      '/profile/settings',
      this.options()
        .method('PATCH')
        .authorization()
        .json(settings)
    )
  }

  async getRealms() {
    return this.fetch<Realm[]>('/realms')
  }

  async getEvents() {
    return this.fetchMany(`/events`, this.options().authorization())
  }

  async getUserAttendingEvent() {
    return this.fetchMany(`/events/attending`, this.options().authorization())
  }

  async getEventAttending(eventId: string) {
    return this.fetch<EventAttendeeAttributes[]>(`/events/${eventId}/attendees`)
  }

  async createEvent(event: EditEvent) {
    return this.fetchOne(
      '/events',
      this.options()
        .method('POST')
        .authorization()
        .json(event)
    )
  }

  async updateEvent(eventId: string, event: Partial<EditEvent>) {
    return this.fetchOne(
      `/events/${eventId}`,
      this.options({ method: 'PATCH' })
        .authorization()
        .json(event)
    )
  }

  async deleteEvent(eventId: string) {
    return this.fetch<{}>(
      `/events/${eventId}`,
      this.options({ method: 'DELETE' })
        .authorization()
    )
  }

  async setEventAttendee(eventId: string, attending: boolean) {
    if (attending) {
      return this.creteEventAttendee(eventId)
    } else {
      return this.deleteEventAttendee(eventId)
    }
  }

  async creteEventAttendee(eventId: string) {
    return this.fetch<EventAttendeeAttributes[]>(
      `/events/${eventId}/attendees`,
      this.options({ method: 'POST' })
        .authorization()
    )
  }

  async updateEventAttendee(eventId: string, attendee: Partial<Pick<EventAttendeeAttributes, 'notify'>> = {}) {
    return this.fetch<EventAttendeeAttributes[]>(
      `/events/${eventId}/attendees`,
      this.options({ method: 'PATCH' })
        .json(attendee)
        .authorization()
    )
  }

  async deleteEventAttendee(eventId: string) {
    return this.fetch<EventAttendeeAttributes[]>(
      `/events/${eventId}/attendees`,
      this.options({ method: 'DELETE' })
        .authorization()
    )
  }

  async getEventById(eventId: string) {
    return this.fetchOne(`/events/${eventId}`, this.options().authorization())
  }

  async uploadPoster(file: File): Promise<PosterAttributes> {
    const body = new FormData()
    body.append('poster', file)
    return this.fetch(`/poster`, this.options({ method: 'POST', body }).authorization())
  }
}