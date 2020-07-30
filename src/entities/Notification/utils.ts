import sender from './sender'
import { SendMailOptions } from './types'
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst'
import API from 'decentraland-gatsby/dist/utils/api/API'
import { EventAttributes } from '../Event/types'
import { eventUrl, eventFacebookUrl, eventTwitterUrl } from '../Event/utils'
import { ProfileSettingsAttributes } from '../ProfileSettings/types'
import Land from 'decentraland-gatsby/dist/utils/api/Land'

export async function sendEmailVerification(email: string, verify_url: string) {
  const options: SendMailOptions<'validate_email_v3'> = {
    template: "validate_email_v3",
    destinations: [
      {
        email,
        replacement: {
          verify_url
        }
      }
    ],
    defaultReplacement: {
      verify_url
    }
  }

  return sender.send(options)
}

export async function sendEmailUpcomingEvent(event: EventAttributes, settings: ProfileSettingsAttributes[]) {
  const replacement = {
    event_name: event.name,
    event_url: eventUrl(event),
    event_img: event.image || event.estate_id && Land.get().getEstateImage(event.estate_id) || Land.get().getParcelImage([event.x, event.y]),
    share_on_facebook: eventFacebookUrl(event),
    share_on_twitter: eventTwitterUrl(event)
  }

  const options: SendMailOptions<'upcoming_event_v2'> = {
    template: "upcoming_event_v2",
    destinations: settings
      .map(profile => ({
        email: profile.email!,
        replacement
      })),
    defaultReplacement: replacement
  }

  return sender.send(options)
}
