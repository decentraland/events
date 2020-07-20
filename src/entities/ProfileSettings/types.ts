export type ProfileSettingsAttributes = {
  user: string
  email: string | null
  email_verified: boolean,
  use_local_time: boolean,
  notify_by_email: boolean,
  notify_by_browser: boolean,
}

export type ProfileSettingsSessionAttributes = ProfileSettingsAttributes & {
  subscriptions: string[]
}

export const DATA_PARAM = 'data'
export const SUBSCRIPTION_PATH = '/verify'
export const UNSUBSCRIBE_PATH = '/unsubscribe'

export const editableAttributes = [
  'email',
  'use_local_time',
  'notify_by_email',
  'notify_by_browser',
]

export enum EmailSubscriptionStatus {
  OK,
  Invalid,
  Expired,
}

export type EmailSubscription = {
  action: 'verify' | 'unsubscribe',
  user: string,
  email: string,
  exp: number
}

export const profileSettingsSchema = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    email: {
      type: 'string',
      format: 'email'
    },
    use_local_time: {
      type: 'boolean'
    },
    notify_by_email: {
      type: 'boolean'
    },
    notify_by_browser: {
      type: 'boolean'
    },
  }
}