import API from 'decentraland-gatsby/dist/utils/api/API'
import env from 'decentraland-gatsby/dist/utils/env'
import Options from './Options'
import { EventAttributes, SessionEventAttributes } from '../entities/Event/types'
import { RequestOptions } from 'decentraland-gatsby/dist/utils/api/Options'
import { EventAttendeeAttributes } from '../entities/EventAttendee/types'
import { PosterAttributes } from '../entities/Poster/types'
import { Realm } from '../entities/Realm/types'

export type NewEvent = Pick<EventAttributes, 'name' | 'description' | 'contact' | 'details' | 'x' | 'y' | 'realm' | 'url' | 'start_at' | 'finish_at' | 'image'>
export type UpdateEvent = Pick<EventAttributes, 'id'> & Partial<Omit<EventAttributes, 'id'>>

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
    return {
      ...event,
      start_at: event.start_at && new Date(Date.parse(event.start_at.toString())),
      finish_at: event.finish_at && new Date(Date.parse(event.finish_at.toString())),
      created_at: event.created_at && new Date(Date.parse(event.created_at.toString())),
      updated_at: event.updated_at && new Date(Date.parse(event.updated_at.toString())),
      attending: Boolean(event.attending),
      editable: Boolean(event.editable),
      owned: Boolean(event.owned),
    } as SessionEventAttributes
  }

  options(options: RequestOptions = {}) {
    return new Options(options)
  }

  async fetch<T extends object>(url: string, options: Options = new Options({})) {
    const result = await super.fetch<{ ok: boolean, data: T }>(url, options)
    return result.data
  }

  async fetchOne(url: string, options: Options = new Options({})) {
    const result = await this.fetch(url, options) as any
    return Events.parse(result)
  }

  async fetchMany(url: string, options: Options = new Options({})) {
    const result = await this.fetch(url, options) as any
    return (result || []).map(Events.parse)
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

  async createEvent(event: NewEvent) {
    return this.fetchOne(
      '/events',
      this.options()
        .method('POST')
        .authorization()
        .json(event)
    )
  }

  async updateEvent(event: UpdateEvent) {
    return this.fetchOne(
      `/events/${event.id}`,
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