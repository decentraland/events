import { SendOptions } from 'decentraland-gatsby/dist/entities/Mail/types'

export type Templates = {
  upcoming_event: {
    event_name: string
    event_url: string
    share_on_facebook: string
    share_on_twitter: string
  },
  validate_email: {
    profile_name: string
    address: string
    verify_url: string
  },
}

export type SendMailOptions<T extends keyof Templates> = SendOptions<T, Templates[T]>

