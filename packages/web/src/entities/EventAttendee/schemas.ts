import {
  AjvObjectSchema,
  apiResultSchema,
} from "decentraland-gatsby/dist/entities/Schema/types"

const eventAttendeeScheme: AjvObjectSchema = {
  type: "object",
  description: "User intention to attend an event",
  properties: {
    event_id: {
      type: "string",
      format: "uuid",
      description: "Event id",
    },
    user: {
      type: "string",
      format: "address",
      description: "User address",
    },
    user_name: {
      type: ["string", "null"],
      description: "Name of the user if any",
    },
    created_at: {
      type: "string",
      format: "date-time",
      description: "The moment the intention to attend was created",
    },
  },
}

export const eventAttendeeListScheme = apiResultSchema({
  type: "array",
  items: eventAttendeeScheme,
})
