import { EventAttributes } from './types'

const DECENTRALAND_URL = process.env.GATSBY_DECENTRALAND_URL || process.env.DECENTRALAND_URL || 'https://play.decentraland.org'

export function eventUrl(event: EventAttributes): string {

  const params = new URLSearchParams()
  params.set('position', [event.x || 0, event.y || 0].join(','))

  if (event.realm) {
    params.set('realm', event.realm)
  }

  return `${DECENTRALAND_URL}/?${params.toString()}`
}