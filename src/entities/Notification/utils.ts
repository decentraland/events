import sender from './sender'
import { SendMailOptions } from './types'
import Katalyst from 'decentraland-gatsby/dist/utils/api/Katalyst'
import API from 'decentraland-gatsby/dist/utils/api/API'
import { EventAttributes } from '../Event/types'
import { eventUrl, eventFacebookUrl, eventTwitterUrl } from '../Event/utils'
import { ProfileSettingsAttributes } from '../ProfileSettings/types'
import { ProfileSubscriptionAttributes } from '../ProfileSubscription/types'

export async function sendEmailVerification(email: string, address: string, verify_url: string) {
  const profile = await API.catch(Katalyst.get().getProfile(address))
  const profile_name = profile?.name || 'Guest'
  const options: SendMailOptions<'validate_email'> = {
    template: "validate_email",
    destinations: [
      {
        email,
        replacement: {
          address,
          profile_name,
          verify_url
        }
      }
    ],
    defaultReplacement: {
      address,
      profile_name,
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
