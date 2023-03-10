import {
  AjvObjectSchema,
  apiResultSchema,
} from "decentraland-gatsby/dist/entities/Schema/types"

import { ScheduleTheme } from "./types"

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
    theme: {
      enum: [
        null,
        ScheduleTheme.MetaverseFestival2022,
        ScheduleTheme.MetaverseFashionWeek2023,
      ],
      description: "Pre-build theme for the schedule",
    },
    background: {
      type: "array",
      description: "List of color used as backgorund",
      items: {
        type: "string",
        minLength: 0,
        maxLength: 255,
      },
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

export const createScheduleSchema: AjvObjectSchema = {
  type: "object",
  description: "Schedules for events",
  required: ["name", "active_since", "active_until"],
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
      type: ["string", "null"],
      format: "uri",
      description: "The url of an image for this schedule",
    },
    theme: {
      enum: [
        null,
        ScheduleTheme.MetaverseFestival2022,
        ScheduleTheme.MetaverseFashionWeek2023,
      ],
      description: "Pre-build theme for the schedule",
    },
    background: {
      type: "array",
      description: "List of color used as backgorund",
      items: {
        type: "string",
        minLength: 0,
        maxLength: 255,
      },
    },
    active: {
      type: "boolean",
      description:
        "Whether the schedule can be displayed in the listing or not",
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

export const updateScheduleSchema: AjvObjectSchema = {
  ...createScheduleSchema,
  required: [],
}
