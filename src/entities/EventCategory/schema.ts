import {
  AjvObjectSchema,
  apiResultSchema,
} from "decentraland-gatsby/dist/entities/Schema/types"

const eventCategoryScheme: AjvObjectSchema = {
  type: "object",
  description: "Tags for events",
  properties: {
    name: {
      type: "string",
      minLength: 0,
      maxLength: 50,
      description: "The category tag label",
    },
    active: {
      type: "boolean",
      description: "Whether the tag can be displayed in the listing or not",
    },
    created_at: {
      description: "the time the tag was created",
      type: "string",
      format: "date-time",
    },
    updated_at: {
      description: "The time the tag was last updated",
      type: "string",
      format: "date-time",
    },
  },
}

export const eventCategoryListScheme = apiResultSchema({
  type: "array",
  items: eventCategoryScheme,
})
