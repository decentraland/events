import sender from './sender'
import { SendMailOptions } from './types'
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst'
import API from 'decentraland-gatsby/dist/utils/api/API'
import { EventAttributes } from '../Event/types'
import { eventUrl, eventFacebookUrl, eventTwitterUrl } from '../Event/utils'
import { ProfileSettingsAttributes } from '../ProfileSettings/types'

export async function sendEmailVerification(email: string, verify_url: string) {
  const options: SendMailOptions<'validate_email_v2'> = {
    template: "validate_email_v2",
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
    share_on_facebook: eventFacebookUrl(event),
    share_on_twitter: eventTwitterUrl(event)
  }

  const options: SendMailOptions<'upcoming_event'> = {
    template: "upcoming_event",
    destinations: settings
      .map(profile => ({
        email: profile.email!,
        replacement
      })),
    defaultReplacement: replacement
  }

  return sender.send(options)
}
