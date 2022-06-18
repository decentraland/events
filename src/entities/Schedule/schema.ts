import {
  AjvObjectSchema,
  apiResultSchema,
} from "decentraland-gatsby/dist/entities/Schema/types"

export const getScheduleSchema: AjvObjectSchema = {
  type: "object",
  description: "Schedules for events",
  properties: {
    name: {
      type: "string",
      minLength: 0,
      maxLength: 50,
      description: "The name of the schedule",
    },
    description: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The description of the schedule",
    },
    image: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The url of an image for this schedule",
    },
    background: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The url of an image for this schedule",
    },
    active_since: {
      description: "the time the schedule is going to start",
      type: "string",
      format: "date-time",
    },
    active_until: {
      description: "The time the schedule is going to end",
      type: "string",
      format: "date-time",
    },
  },
}

export const scheduleScheme: AjvObjectSchema = {
  type: "object",
  description: "Schedules for events",
  properties: {
    id: {
      type: "string",
      format: "uudi",
      description: "schedule id",
    },
    name: {
      type: "string",
      minLength: 0,
      maxLength: 50,
      description: "The name of the schedule",
    },
    description: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The description of the schedule",
    },
    image: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The url of an image for this schedule",
    },
    background: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The url of an image for this schedule",
    },
    active_since: {
      description: "the time the schedule is going to start",
      type: "string",
      format: "date-time",
    },
    active_until: {
      description: "The time the schedule is going to end",
      type: "string",
      format: "date-time",
    },
    active: {
      type: "boolean",
      description:
        "Whether the schedule can be displayed in the listing or not",
    },
    created_at: {
      description: "the time the schedule was created",
      type: "string",
      format: "date-time",
    },
    updated_at: {
      description: "The time the schedule was last updated",
      type: "string",
      format: "date-time",
    },
  },
}

export const scheduleListScheme = apiResultSchema({
  type: "array",
  items: scheduleScheme,
})

export const newScheduleSchema = {
  type: "object",
  description: "Schedules for events",
  required: [
    "name",
    "description",
    "image",
    "background",
    "active_since",
    "active_until",
  ],
  properties: {
    name: {
      type: "string",
      minLength: 0,
      maxLength: 50,
      description: "The name of the schedule",
    },
    description: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The description of the schedule",
    },
    image: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The url of an image for this schedule",
    },
    background: {
      type: "string",
      minLength: 0,
      maxLength: 255,
      description: "The url of an image for this schedule",
    },
    active_since: {
      description: "the time the schedule is going to start",
      type: "string",
      format: "date-time",
    },
    active_until: {
      description: "The time the schedule is going to end",
      type: "string",
      format: "date-time",
    },
  },
}
