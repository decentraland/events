
import { Model, SQL, raw } from 'decentraland-server'
import { utils } from 'decentraland-commons';
import { table, conditional, limit, offset } from 'decentraland-gatsby/dist/entities/Database/utils';
import { EventAttributes, SessionEventAttributes, EventListOptions, eventSchema } from './types'
import { Address } from 'web3x/address'
import EventAttendee from '../EventAttendee/model'
import schema from '../Schema'
import isAdmin from '../Auth/isAdmin';

export default class Event extends Model<EventAttributes> {
  static tableName = 'events'

  static validator = schema.compile(eventSchema)

  static async getEvents(options: Partial<EventListOptions> = {}) {

    const query = SQL`
      SELECT 
        e.*
        ${conditional(!!options.user, SQL`, a.user is not null as attending`)}
      FROM ${table(Event)} e
        ${conditional(!!options.user, SQL`LEFT JOIN ${table(EventAttendee)} a on e.id = a.event_id AND lower(a.user) = ${options.user}`)}
      WHERE
        e.finish_at > now()
        AND e.rejected IS FALSE
        ${conditional(!options.user, SQL`AND e.approved IS TRUE`)}
        ${conditional(!!options.user && !isAdmin(options.user), SQL`AND (e.approved IS TRUE OR lower(e.user) = ${options.user})`)}
        ${conditional(!!options.onlyAttendee && !isAdmin(options.user), SQL`AND (e.approved IS TRUE OR lower(e.user) = ${options.user})`)}
      ORDER BY start_at ASC
      ${limit(options.limit)}
      ${offset(options.offset)}
    `

    return Event.query<EventAttributes>(query)
  }

  static async getAttending(user?: string | null) {
    if (!Address.isAddress(user || '')) {
      return []
    }

    return Event.query<EventAttributes>(SQL`
      SELECT e.*, a.user is not null as attending
      FROM ${table(Event)} e
      LEFT JOIN ${table(EventAttendee)} a on e.id = a.event_id AND a.user = ${user}
      WHERE e.finish_at > now() AND e.rejected IS FALSE
    `)
  }

  static validate(event: EventAttributes): string[] | null {
    if (!this.isValid(event) && this.validator.errors && this.validator.errors.length > 0) {
      return this.validator.errors.slice().map((error) => error.message!).filter(Boolean)
    }

    const errors: string[] = []
    const start_at = new Date(Date.parse(event.start_at.toString()))
    const finish_at = new Date(Date.parse(event.finish_at.toString()))

    if (start_at.getTime() > finish_at.getTime()) {
      errors.push(`finish date must be greater than start date`)
    }

    if (errors.length) {
      return errors
    }

    return null
  }

  static isValid(event: Partial<EventAttributes>) {
    return this.validator(event) as boolean
  }

  static toPublic(event: EventAttributes, user?: string | null): SessionEventAttributes | EventAttributes {
    const editable = isAdmin(user)
    const owned = Boolean(user && event.user && event.user === user)

    if (event.user !== user && !editable) {
      event = utils.omit(event, ['contact', 'details'])
    }

    return {
      ...event,
      editable,
      owned
    }
  }
}