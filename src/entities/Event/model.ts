
import { Model, SQL } from 'decentraland-server'
import { utils } from 'decentraland-commons';
import { table, conditional, limit, offset } from 'decentraland-gatsby/dist/entities/Database/utils';
import schema from 'decentraland-gatsby/dist/entities/Schema'
import isEthereumAddress from 'validator/lib/isEthereumAddress'
import { EventAttributes, SessionEventAttributes, EventListOptions, eventSchema, DeprecatedEventAttributes } from './types'
import EventAttendee from '../EventAttendee/model'
import isAdmin from '../Auth/isAdmin';
import { start } from 'repl';

export default class Event extends Model<DeprecatedEventAttributes> {
  static tableName = 'events'

  static validator = schema.compile(eventSchema)

  static build(event: EventAttributes | null | undefined): DeprecatedEventAttributes | null | undefined {
    if (!event) {
      return event
    }

    const start_at = new Date(Date.parse(event.start_at.toString()))
    const finish_at = new Date(Date.parse(event.finish_at.toString()))
    const duration = Number(event.duration) || finish_at.getTime() - start_at.getTime()
    const recurrent_dates = Array.isArray(event.recurrent_dates) && event.recurrent_dates.length > 0 ?
      event.recurrent_dates.map(date => new Date(Date.parse(date.toString()))) : [start_at]

    if (event.recurrent_dates[0].getTime() !== start_at.getTime()) {
      recurrent_dates.unshift(start_at)
    }

    return {
      ...event,
      duration,
      recurrent_dates,
      scene_name: event.estate_name,
      coordinates: [event.x, event.y]
    }
  }

  static buildAll(events: EventAttributes[]): DeprecatedEventAttributes[] {
    return events.map(event => Event.build(event) as DeprecatedEventAttributes)
  }

  static async getEvents(options: Partial<EventListOptions> = {}) {

    const query = SQL`
      SELECT 
        e.*
        ${conditional(!!options.currentUser, SQL`, a.user is not null as attending`)}
      FROM ${table(Event)} e
        ${conditional(!!options.currentUser, SQL`LEFT JOIN ${table(EventAttendee)} a on e.id = a.event_id AND lower(a.user) = ${options.currentUser}`)}
      WHERE
        e.rejected IS FALSE
        AND e.finish_at > now()
        ${conditional(!!options.onlyUpcoming, SQL`AND e.start_at > now()`)}
        ${conditional(!!options.user, SQL`AND e.user = ${options.user}`)}
        ${conditional(!options.currentUser, SQL`AND e.approved IS TRUE`)}
        ${conditional(!!options.currentUser && !isAdmin(options.currentUser), SQL`AND (e.approved IS TRUE OR lower(e.user) = ${options.currentUser})`)}
        ${conditional(!!options.onlyAttendee && !isAdmin(options.currentUser), SQL`AND (e.approved IS TRUE OR lower(e.user) = ${options.currentUser})`)}
        ${conditional(Number.isFinite(options.x as number), SQL`AND e.x = ${options.x}`)}
        ${conditional(Number.isFinite(options.y as number), SQL`AND e.y = ${options.y}`)}
        ${conditional(!!options.estateId, SQL`AND e.estate_id = ${options.estateId}`)}
      ORDER BY start_at ASC
      ${limit(options.limit)}
      ${offset(options.offset)}
    `

    return Event.buildAll(await Event.query<EventAttributes>(query))
  }

  static async getAttending(user?: string | null) {
    if (!isEthereumAddress(user || '')) {
      return []
    }

    return Event.buildAll(await Event.query<DeprecatedEventAttributes>(SQL`
      SELECT e.*, a.user is not null as attending
      FROM ${table(Event)} e
      LEFT JOIN ${table(EventAttendee)} a on e.id = a.event_id AND a.user = ${user}
      WHERE e.finish_at > now() AND e.rejected IS FALSE
    `))
  }

  static validate(event: EventAttributes): string[] | null {
    if (!this.isValid(event) && this.validator.errors && this.validator.errors.length > 0) {
      return this.validator.errors.slice().map((error) => error.message!).filter(Boolean)
    }

    const errors: string[] = []
    const start_at = new Date(Date.parse(event.start_at.toString()))
    const recurrent_until = event.recurrent_until && new Date(Date.parse(event.recurrent_until.toString()))

    if (recurrent_until && start_at.getTime() > recurrent_until.getTime() + 1000 * 60 * 60 * 24) {
      errors.push(`recurrent must finish after the start date`)
    }

    if (errors.length) {
      return errors
    }

    return null
  }

  static isValid(event: Partial<EventAttributes>) {
    return this.validator(event) as boolean
  }

  static toPublic(event: DeprecatedEventAttributes & { attending?: boolean }, user?: string | null): SessionEventAttributes {
    const now = Date.now()
    const editable = isAdmin(user)
    const owned = Boolean(user && event.user && event.user === user)

    if (event.user !== user && !editable) {
      event = utils.omit(event, ['contact', 'details'])
    }

    const next_start_at = event.recurrent_dates.find((date) => (date.getTime() + event.duration) > now) || event.recurrent_dates[event.recurrent_dates.length - 1]
    const live = now >= next_start_at.getTime() && now < (next_start_at.getTime() + event.duration)

    return {
      ...event,
      estate_name: event.estate_name || event.scene_name,
      attending: !!event.attending,
      next_start_at,
      position: [event.x, event.y],
      editable,
      owned,
      live,
    }
  }
}