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

export const DEFAULT_PROFILE_SETTINGS: ProfileSettingsAttributes = {
  user: "0x0000000000000000000000000000000000000000",
  email: null,
  email_verified: false,
  email_verified_at: null,
  email_updated_at: null,
  use_local_time: true,
  notify_by_email: false,
  notify_by_browser: false,
  permissions: [],
  created_at: new Date(0),
  updated_at: new Date(0),
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
  EditAnyProfile = "edit_any_profile",
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

export const updateProfileSettingsSchema = {
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

export const updateMyProfileSettingsSchema = {
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
