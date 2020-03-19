import APIOptions from 'decentraland-gatsby/dist/utils/api/Options'
import { getCurrentProfile } from 'decentraland-gatsby/dist/utils/auth/identify'
import { Profile } from 'decentraland-gatsby/dist/utils/auth/types'
import { toBase64 } from 'decentraland-gatsby/dist/utils/base64'

export default class Options extends APIOptions {
  authorization() {
    const profile: Profile | null = getCurrentProfile()
    if (
      !profile ||
      !profile.identity ||
      !profile.identity.authChain ||
      !profile.identity.ephemeralIdentity ||
      !profile.identity.ephemeralIdentity.address
    ) {
      return this
    }

    const identity = {
      ...profile.identity,
      ephemeralIdentity: {
        address: profile.identity.ephemeralIdentity.address
      }
    }

    return this.header('Authorization', 'Bearer ' + toBase64(JSON.stringify(identity)))
  }
}
