import { SendOptions } from "decentraland-gatsby/dist/entities/Mail/types"

export type Templates = {
  upcoming_event: {
    event_name: string
    event_url: string
    share_on_facebook: string
    share_on_twitter: string
  }
  upcoming_event_v2: {
    event_img: string
    event_name: string
    event_url: string
    share_on_facebook: string
    share_on_twitter: string
  }
  upcoming_event_v3: {
    event_img: string
    event_name: string
    event_url: string
    event_target_url: string
    share_on_facebook: string
    share_on_twitter: string
  }
  validate_email: {
    profile_name: string
    address: string
    verify_url: string
  }
  validate_email_v2: {
    verify_url: string
  }
  validate_email_v3: {
    verify_url: string
  }
}

export type SendMailOptions<T extends keyof Templates> = SendOptions<
  T,
  Templates[T]
>
