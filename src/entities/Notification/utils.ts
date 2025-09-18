import Land from "decentraland-gatsby/dist/utils/api/Land"

import sender from "./sender"
import { TemplateOptions } from "./types"
import { EventAttributes } from "../Event/types"
import {
  eventFacebookUrl,
  eventTargetUrl,
  eventTwitterUrl,
  eventUrl,
} from "../Event/utils"
import { ProfileSettingsAttributes } from "../ProfileSettings/types"

export async function sendEmailVerification(email: string, verify_url: string) {
  const data: TemplateOptions<"validate_email_v3"> = {
    template: "validate_email_v3",
    defaultReplacement: {
      verify_url,
    },
  }

  const destinations = [
    {
      email,
      replacement: {
        verify_url,
      },
    },
  ]

  return sender.send(destinations, data)
}

export async function sendEmailUpcomingEvent(
  event: EventAttributes,
  settings: ProfileSettingsAttributes[]
) {
  const replacement = {
    event_name: event.name,
    event_url: eventUrl(event),
    event_target_url: eventTargetUrl(event),
    event_img:
      event.image ||
      (event.estate_id && Land.get().getEstateImage(event.estate_id)) ||
      Land.get().getParcelImage([event.x, event.y]),
    share_on_facebook: eventFacebookUrl(event),
    share_on_twitter: eventTwitterUrl(event),
  }

  const destinations = settings.map((profile) => ({
    email: profile.email!,
    replacement,
  }))

  const data: TemplateOptions<"upcoming_event_v3"> = {
    template: "upcoming_event_v3",
    defaultReplacement: replacement,
  }

  return sender.send(destinations, data)
}
