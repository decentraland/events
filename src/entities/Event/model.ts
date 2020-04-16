
import { Model, SQL, raw } from 'decentraland-server'
import { utils } from 'decentraland-commons';
import { table, conditional, limit, offset } from 'decentraland-gatsby/dist/entities/Database/utils';
import { EventAttributes, PublicEventAttributes, EventListOptions } from './types'
import { Address } from 'web3x/address'
import EventAttendee from '../EventAttendee/model'
import schema from '../Schema'
import isAdmin from '../Auth/isAdmin';

export default class Event extends Model<EventAttributes> {
  static tableName = 'events'

  static validator = schema.compile({
    type: 'object',
    additionalProperties: false,
    required: [
      'name',
      'start_at',
      'finish_at',
      'coordinates'
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 0,
        maxLength: 100,
      },
      description: {
        type: ['string', 'null'],
        minLength: 0,
        maxLength: 5000,
      },
      approved: {
        type: 'boolean'
      },
      rejected: {
        type: 'boolean'
      },
      image: {
        type: ['string', 'null'],
        format: 'url',
        optional: true,
      },
      start_at: {
        type: 'string',
        format: 'date-time'
      },
      finish_at: {
        type: 'string',
        format: 'date-time'
      },
      coordinates: {
        type: 'array',
        minItems: 2,
        maxItems: 2,
        items: {
          type: 'number',
          maximum: 150,
          minimum: -150,
        }
      },
      contact: {
        type: ['string', 'null'],
      },
      details: {
        type: ['string', 'null'],
        minLength: 0,
        maxLength: 500,
      },
      url: {
        type: 'string',
        format: 'url',
      },
      scene_name: {
        type: ['string', 'null'],
        minLength: 0,
        maxLength: 500,
      }
    }
  })

  static async getEvents({ user, limit: limitValue, offset: offsetValue }: Partial<EventListOptions> = {}) {

    const query = SQL`
      SELECT 
        e.*
        ${conditional(!!user, SQL`, a.user is not null as attending`)}
      FROM ${table(Event)} e
        ${conditional(!!user, SQL`LEFT JOIN ${table(EventAttendee)} a on e.id = a.event_id AND lower(a.user) = ${user}`)}
      WHERE
        e.finish_at > now()
        AND e.rejected IS FALSE
        ${conditional(!user, SQL`AND e.approved IS TRUE`)}
        ${conditional(!!user && !isAdmin(user), SQL`AND (e.approved IS TRUE OR lower(e.user) = ${user})`)}
      ORDER BY start_at ASC
      ${limit(limitValue)}
      ${offset(offsetValue)}
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

  static toPublic(event: EventAttributes, user?: string | null): PublicEventAttributes | EventAttributes {
    const editable = isAdmin(user)

    if (event.user !== user && !editable) {
      event = utils.omit(event, ['contact', 'details'])
    }

    return {
      ...event,
      editable
    }
  }
}