import API from "decentraland-gatsby/dist/utils/api/API"
import Options from "decentraland-gatsby/dist/utils/api/Options"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"

import {
  EventAttributes,
  SessionEventAttributes,
} from "../entities/Event/types"
import { EventAttendeeAttributes } from "../entities/EventAttendee/types"
import { EventCategoryAttributes } from "../entities/EventCategory/types"
import { PosterAttributes } from "../entities/Poster/types"
import { ProfileSettingsAttributes } from "../entities/ProfileSettings/types"
import { ScheduleAttributes } from "../entities/Schedule/types"

export type EditEvent = Pick<
  EventAttributes,
  | "name"
  | "image"
  | "description"
  | "start_at"
  | "duration"
  | "all_day"
  | "x"
  | "y"
  | "server"
  | "url"
  | "approved"
  | "rejected"
  | "highlighted"
  | "trending"
  | "recurrent"
  | "recurrent_count"
  | "recurrent_frequency"
  | "recurrent_interval"
  | "recurrent_month_mask"
  | "recurrent_weekday_mask"
  | "recurrent_setpos"
  | "recurrent_monthday"
  | "recurrent_until"
  | "contact"
  | "details"
  | "categories"
  | "schedules"
>

export default class Events extends API {
  static Url =
    process.env.GATSBY_EVENTS_URL || `https://events.decentraland.org/api`

  static Cache = new Map<string, Events>()

  static from(url: string) {
    if (!this.Cache.has(url)) {
      this.Cache.set(url, new Events(url))
    }

    return this.Cache.get(url)!
  }

  static get() {
    return this.from(env("EVENTS_URL", this.Url))
  }

  static parseEvent(event: SessionEventAttributes): SessionEventAttributes {
    const start_at = event.start_at && Time.date(event.start_at)
    const next_start_at = event.next_start_at && Time.date(event.next_start_at)
    const next_finish_at =
      event.next_finish_at && Time.date(event.next_finish_at)
    const finish_at = event.finish_at && Time.date(event.finish_at)
    const created_at = event.created_at && Time.date(event.created_at)
    const updated_at = event.updated_at && Time.date(event.updated_at)
    const recurrent_until =
      event.recurrent_until && Time.date(event.recurrent_until)
    const duration =
      Number(event.duration) || finish_at.getTime() - start_at.getTime()
    const recurrent_dates =
      Array.isArray(event.recurrent_dates) && event.recurrent_dates.length > 0
        ? event.recurrent_dates.map((date) => Time.date(date))
        : [start_at]

    return {
      ...event,
      start_at,
      finish_at,
      next_start_at,
      next_finish_at,
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

  static parseSettings(
    settings: Record<string, any>
  ): ProfileSettingsAttributes {
    const email_verified_at =
      settings.email_verified_at && Time.date(settings.email_verified_at)
    const email_updated_at =
      settings.email_updated_at && Time.date(settings.email_updated_at)

    return {
      ...settings,
      email_verified_at,
      email_updated_at,
    } as ProfileSettingsAttributes
  }

  async fetch<T extends object>(
    url: string,
    options: Options = new Options({})
  ) {
    const result = await super.fetch<{ ok: boolean; data: T }>(url, options)
    return result.data
  }

  async fetchOne(
    url: string,
    options: Options = new Options({})
  ): Promise<SessionEventAttributes> {
    const result = (await this.fetch(url, options)) as any
    return Events.parseEvent(result)
  }

  async fetchMany(
    url: string,
    options: Options = new Options({})
  ): Promise<SessionEventAttributes[]> {
    const result = (await this.fetch(url, options)) as any
    return (result || []).map(Events.parseEvent)
  }

  async createSubscription(subscription: {
    endpoint: string
    p256dh: string
    auth: string
  }) {
    return this.fetch<{}>(
      "/profile/subscription",
      this.options()
        .authorization({ sign: true })
        .json(subscription)
        .method("POST")
    )
  }

  async removeSubscriptions() {
    return this.fetch<{}>(
      "/profile/subscription",
      this.options().authorization({ sign: true }).method("DELETE")
    )
  }

  async getMyProfileSettings() {
    const data = await this.fetch<ProfileSettingsAttributes>(
      "/profile/settings",
      this.options().authorization({ sign: true })
    )

    return Events.parseSettings(data)
  }

  async updateProfileSettings(
    settings: Partial<ProfileSettingsAttributes> = {}
  ) {
    const data = await this.fetch<ProfileSettingsAttributes>(
      "/profile/settings",
      this.options()
        .method("PATCH")
        .authorization({ sign: true })
        .json(settings)
    )

    return Events.parseSettings(data)
  }

  async getEvents() {
    return this.fetchMany(
      `/events`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getUserAttendingEvent() {
    return this.fetchMany(
      `/events/attending`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async getEventAttending(eventId: string) {
    return this.fetch<EventAttendeeAttributes[]>(`/events/${eventId}/attendees`)
  }

  async createEvent(event: EditEvent) {
    return this.fetchOne(
      "/events",
      this.options().method("POST").authorization({ sign: true }).json(event)
    )
  }

  async updateEvent(eventId: string, event: Partial<EditEvent>) {
    return this.fetchOne(
      `/events/${eventId}`,
      this.options({ method: "PATCH" })
        .authorization({ sign: true })
        .json(event)
    )
  }

  async deleteEvent(eventId: string) {
    return this.fetch<{}>(
      `/events/${eventId}`,
      this.options({ method: "DELETE" }).authorization({ sign: true })
    )
  }

  async notifyEvent(eventId: string) {
    return this.fetch<{}>(
      `/events/${eventId}/notifications`,
      this.options({ method: "POST" }).authorization({ sign: true })
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
      this.options({ method: "POST" }).authorization({ sign: true })
    )
  }

  async updateEventAttendee(
    eventId: string,
    attendee: Partial<Pick<EventAttendeeAttributes, "notify">> = {}
  ) {
    return this.fetch<EventAttendeeAttributes[]>(
      `/events/${eventId}/attendees`,
      this.options({ method: "PATCH" })
        .json(attendee)
        .authorization({ sign: true })
    )
  }

  async deleteEventAttendee(eventId: string) {
    return this.fetch<EventAttendeeAttributes[]>(
      `/events/${eventId}/attendees`,
      this.options({ method: "DELETE" }).authorization({ sign: true })
    )
  }

  async getEventById(eventId: string) {
    return this.fetchOne(
      `/events/${eventId}`,
      this.options().authorization({ sign: true, optional: true })
    )
  }

  async uploadPoster(file: File): Promise<PosterAttributes> {
    const body = new FormData()
    body.append("poster", file)
    return this.fetch(
      `/poster`,
      this.options({ method: "POST", body }).authorization({ sign: true })
    )
  }

  async getCategories(): Promise<EventCategoryAttributes[]> {
    return this.fetch(`/events/categories`)
  }

  async getSchedules(): Promise<ScheduleAttributes[]> {
    return this.fetch(`/schedules`)
  }

  async getSchedule(schedule_id: string): Promise<ScheduleAttributes> {
    return this.fetch(`/schedules/${schedule_id}`)
  }
}
