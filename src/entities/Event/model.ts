
import { Model, SQL, raw } from 'decentraland-server'
import { utils } from 'decentraland-commons';
import { EventAttributes, PublicEventAttributes } from './types'
import { Address } from 'web3x/address'
import EventAttendee from '../EventAttendee/model'
import schema from '../Schema'

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
        type: 'string',
        minLength: 0,
        maxLength: 500,
      },
      image: {
        type: 'string',
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
        type: 'string',
        format: 'email'
      },
      details: {
        type: 'string',
        minLength: 0,
        maxLength: 100,
      }
    }
    // id: string // primary key
    // name: string
    // image: string
    // description: string
    // timestamp: Date
    // duration: number
    // coordinates: [number, number]
    // user: string
    // approved: boolean
    // created_at: Date
    // contact: string,
    // detail: string
  })

  static async getAttending(user: string) {
    if (!Address.isAddress(user)) {
      return []
    }

    return Event.query<EventAttributes>(SQL`
      SELECT e.*
      FROM ${raw(Event.tableName)} e
      LEFT JOIN ${raw(EventAttendee.tableName)} a on e.id = a.event_id
      WHERE a.user = ${user}
    `)
  }

  static validate(event: EventAttributes): string[] | null {
    if (!this.isValid(event) && this.validator.errors && this.validator.errors.length > 0) {
      return this.validator.errors.slice().map((error) => error.message!).filter(Boolean)
    }

    const errors: string[] = []
    const now = Date.now()
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
    if (event.user === user) {
      return event
    }

    return utils.omit(event, ['contact', 'details'])
  }
}