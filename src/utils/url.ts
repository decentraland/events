import { Location as HLocation } from 'history';
import { TemporaryCredentials } from 'aws-sdk';

export type WindowLocation = Window['location'] & HLocation;

export default {

  toUrl(pathname: string, params: string = '', hash: string = '') {
    if (pathname.slice(-1) !== '/') {
      pathname = pathname + '/'
    }

    if (params && params[0] !== '?') {
      params = '?' + params
    }

    if (hash && hash[0] !== '#') {
      hash = '#' + hash
    }

    return pathname + params + hash
  },

  toHome(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.delete('event')
    targetSearchParams.delete('view')
    return this.toUrl('/', targetSearchParams.toString())
  },

  isHome(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return !targetSearchParams.has('event') && !targetSearchParams.has('view')
  },

  toEvent(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.delete('view')
    return this.toUrl('/', targetSearchParams.toString())
  },

  isEvent(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && !targetSearchParams.has('view')
  },

  getEventId(location: WindowLocation) {
    const searchParams = new URLSearchParams(location.search)
    return location && searchParams.get('event') || null
  },

  toEventEdit(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'edit')
    return this.toUrl('/submit', targetSearchParams.toString())
  },

  isEventEdit(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'edit'
  },

  toEventClone(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'clone')
    return this.toUrl('/submit', targetSearchParams.toString())
  },

  isEventClone(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'clone'
  },

  toEventAttendees(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'attendees')
    return this.toUrl('/', targetSearchParams.toString())
  },

  isEventAttendees(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'attendees'
  },

  toSubmit(location: WindowLocation) {
    return this.toUrl('/submit')
  }
}