import {
  AjvObjectSchema,
  TruthyEnum,
} from "decentraland-gatsby/dist/entities/Schema/types"
import { Frequencies } from "./types"

export const getEventParamsSchema: AjvObjectSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    event_id: {
      type: "string",
      format: "uuid",
      description: "Event ID",
    },
  },
}

export const getEventListQuery: AjvObjectSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: {
      type: "string",
      format: 'uint'
    },
    offset: {
      type: "string",
      format: 'uint'
    },
    position: {
      type: "string",
      pattern: "^-?\\d{1,3},-?\\d{1,3}$",
      description: "Filter events that will happend in a specific position",
    },
    estate_id: {
      type: "string",
      format: "int",
      description: "Filter events that will happend in a specific estate",
    },
    creator: {
      type: "string",
      format: "address",
      description: "Filter events created by a user",
    },
    only_attendee: {
      enum: TruthyEnum,
      description: "Filter events that user will go (requires authentication)",
    },
    list: {
      description: "Filter event using one of the following list",
      default: "active",
      oneOf: [
        {
          enum: [ "all" ],
          description: "All events",
        },
        {
          enum: [ "active" ],
          description: "Only current and future events",
        },
        {
          enum: [ "live" ],
          description: "Only current events",
        },
        {
          enum: [ "upcoming" ],
          description: "Only future events",
        },
      ],
    },
    order: {
      description: "List order",
      default: "asc",
      enum: ["asc", "desc"]
    }
  },
}

export const eventSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 0,
      maxLength: 150,
      description: "The event name",
    },
    description: {
      type: "string",
      minLength: 0,
      maxLength: 5000,
      description: "The event description on markdown",
    },
    approved: {
      type: "boolean",
      description: "True if the event was approved by an admin",
    },
    rejected: {
      type: "boolean",
      description: "True if the event was rejected by an admin",
    },
    highlighted: {
      type: "boolean",
      description: "True if the event is highlighted",
    },
    trending: {
      type: "boolean",
      description: "True if the event is tending",
    },
    image: {
      description: "Url to the event cover",
      type: "string",
      format: "uri",
    },
    user: {
      descrioption: "The user who created the event",
      type: "string",
      format: "address",
    },
    user_name: {
      descrioption: "The user name who created the event",
      type: "string",
      format: "address",
    },

    total_attendees: {
      type: "number",
      minimum: 0,
      description:
        "The number of users who specified that they will attend the event",
    },

    latest_attendees: {
      type: "array",
      description:
        "A list of the latest users who specified that they will attend the event",
      items: {
        type: "string",
        format: "address",
      },
    },

    url: {
      description: "The url where the event will take place",
      type: "string",
      format: "uri",
    },
    scene_name: {
      description: "The scene name where the event will take place",
      type: "string",
    },
    start_at: {
      description: "The initial date of the event",
      type: "string",
      format: "date-time",
    },
    finish_at: {
      description: "The latest data of the event",
      type: "string",
      format: "date-time",
    },
    next_start_at: {
      description: "The next start of the event",
      type: "string",
      format: "date-time",
    },
    next_finish_at: {
      description: "The next finish of the event",
      type: "string",
      format: "date-time",
    },
    all_day: {
      description: "True if the event is all day long",
      type: "boolean",
    },
    recurrent: {
      type: "boolean",
      description: "True if the event si recurrent",
    },
    recurrent_frequency: {
      description:
        "Rrule FREQ configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      enum: [...Frequencies, null],
    },
    recurrent_setpos: {
      description:
        "Rrule BYSETPOS configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: ["number", "null"],
      minimum: 0,
    },
    recurrent_monthday: {
      description:
        "Rrule BYMONTHDAY configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: ["number", "null"],
    },
    recurrent_weekday_mask: {
      description:
        "Rrule WEEKDAY configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: "number",
      minimum: 0,
    },
    recurrent_month_mask: {
      description:
        "Rrule BYMONTH configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: "number",
      minimum: 0,
    },
    recurrent_interval: {
      description:
        "Rrule INTERVAL configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: "number",
      minimum: 0,
    },
    recurrent_count: {
      description:
        "Rrule COUNT configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: ["number", "null"],
    },
    recurrent_until: {
      description:
        "Rrule UNTIL configuration, see: https://datatracker.ietf.org/doc/html/rfc5545",
      type: ["string", "null"],
      format: "date-time",
    },
    created_at: {
      description: "the time the event was created",
      type: "string",
      format: "date-time",
    },
    updated_at: {
      description: "The time the event was last updated",
      type: "string",
      format: "date-time",
    },
  },
}

export const newEventSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "start_at", "duration", "x", "y"],
  properties: {
    name: {
      type: "string",
      minLength: 0,
      maxLength: 150,
      description: "The event name",
    },
    description: {
      type: ["string", "null"],
      minLength: 0,
      maxLength: 5000,
      description: "The event description on markdown",
    },
    approved: {
      type: "boolean",
      description: "When ever the event was approved by and administrator",
    },
    rejected: {
      type: "boolean",
    },
    highlighted: {
      type: "boolean",
    },
    trending: {
      type: "boolean",
    },
    image: {
      type: ["string", "null"],
      format: "uri",
    },
    start_at: {
      type: "string",
      format: "date-time",
    },
    duration: {
      type: "number",
      minimum: 0,
    },
    all_day: {
      type: "boolean",
    },
    recurrent: {
      type: "boolean",
    },
    recurrent_frequency: {
      enum: [...Frequencies, null],
    },
    recurrent_setpos: {
      type: ["number", "null"],
      minimum: 0,
    },
    recurrent_monthday: {
      type: ["number", "null"],
    },
    recurrent_weekday_mask: {
      type: "number",
      minimum: 0,
    },
    recurrent_month_mask: {
      type: "number",
      minimum: 0,
    },
    recurrent_interval: {
      type: "number",
      minimum: 0,
    },
    recurrent_count: {
      type: ["number", "null"],
    },
    recurrent_until: {
      type: ["string", "null"],
      format: "date-time",
    },
    x: {
      type: "number",
      maximum: 170,
      minimum: -170,
    },
    y: {
      type: "number",
      maximum: 170,
      minimum: -170,
    },
    server: {
      type: ["string", "null"],
    },
    contact: {
      type: ["string", "null"],
      minLength: 0,
      maxLength: 100,
    },
    details: {
      type: ["string", "null"],
      minLength: 0,
      maxLength: 5000,
    },
    url: {
      type: "string",
      format: "uri",
    },
  },
}
