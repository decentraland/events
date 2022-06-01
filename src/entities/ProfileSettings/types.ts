import { AjvObjectSchema } from "decentraland-gatsby/dist/entities/Schema/types"

export type ProfileSettingsAttributes = {
  user: string
  email: string | null
  email_verified: boolean
  email_verified_at: Date | null
  email_updated_at: Date | null
  use_local_time: boolean
  notify_by_email: boolean
  notify_by_browser: boolean
  permissions: ProfilePermissions[]
  created_at: Date
  updated_at: Date
}

export type ProfileSettingsSessionAttributes = ProfileSettingsAttributes & {
  subscriptions: string[]
}

export const DATA_PARAM = "data"
export const SUBSCRIPTION_PATH = "/verify"
export const UNSUBSCRIBE_PATH = "/unsubscribe"

export enum ProfilePermissions {
  ApproveOwnEvent = "approve_own_event",
  ApproveAnyEvent = "approve_any_event",
  EditAnyEvent = "edit_any_event",
  EditAnySchedule = "edit_any_schedule",
  EditAnyProfile = "edit_any_schedule",
  TestAnyNotification = "test_any_notification",
}

export enum EmailSubscriptionStatus {
  OK,
  Invalid,
  Expired,
}

export type EmailSubscription = {
  action: "verify" | "unsubscribe"
  user: string
  email: string
  exp: number
}

export const updateProfileSettingsSchema: AjvObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    permissions: {
      type: "array",
      items: {
        enum: [
          ProfilePermissions.ApproveAnyEvent,
          ProfilePermissions.ApproveOwnEvent,
          ProfilePermissions.EditAnyEvent,
          ProfilePermissions.EditAnySchedule,
          ProfilePermissions.EditAnyProfile,
        ],
      },
    },
  },
}

export const updateMyProfileSettingsSchema: AjvObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    email_verified: {
      type: "boolean",
    },
    use_local_time: {
      type: "boolean",
    },
    notify_by_email: {
      type: "boolean",
    },
    notify_by_browser: {
      type: "boolean",
    },
  },
}
