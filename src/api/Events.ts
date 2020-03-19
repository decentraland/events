import API from 'decentraland-gatsby/dist/utils/api/API'
import env from 'decentraland-gatsby/dist/utils/env'
import Options from './Options'
import { EventAttributes } from '../entities/Event/types'
import { RequestOptions } from 'decentraland-gatsby/dist/utils/api/Options'

export type NewEvent = Omit<EventAttributes, 'id' | 'user' | 'image' | 'created_at' | 'approved' | 'approved'>

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

  options(options: RequestOptions = {}) {
    return new Options(options)
  }

  async fetch<T extends object>(url: string, options: Options = new Options({})) {
    const result = await super.fetch<{ ok: boolean, data: T }>(url, options)
    return result.data
  }

  async getEvents() {
    return this.fetch<EventAttributes[]>(`/events`, this.options().authorization())
  }

  async getAttendingEvent() {
    return this.fetch<EventAttributes[]>(`/events/attending`, this.options().authorization())
  }

  async createEvent(event: NewEvent) {
    return this.fetch<EventAttributes>(
      '/events',
      this.options()
        .method('POST')
        .authorization()
        .json(event)
    )
  }

  async updateEvent(event: Pick<EventAttributes, 'id'> & Partial<Omit<EventAttributes, 'id'>>) {
    if (!event.id) {
      return event
    }

    return this.fetch<EventAttributes>(
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

  async getEventById(eventId: string) {
    return this.fetch<EventAttributes>(`/events/${eventId}`, this.options().authorization())
  }
}