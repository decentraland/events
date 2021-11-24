import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"

export type ProfileSubscriptionAttributes = {
  user: string
  endpoint: string
  p256dh: string
  auth: string
}

export const profileSubscriptionSchema: AjvObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: ["endpoint", "p256dh", "auth"],
  properties: {
    endpoint: {
      type: "string",
    },
    p256dh: {
      type: "string",
    },
    auth: {
      type: "string",
    },
  },
}
