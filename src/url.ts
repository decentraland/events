import { Location as HLocation } from 'history';

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
    return this.toUrl(location.pathname, targetSearchParams.toString())
  },

  isHome(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return !targetSearchParams.has('event') && !targetSearchParams.has('view')
  },

  toEvent(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.delete('view')
    return this.toUrl(location.pathname, targetSearchParams.toString())
  },

  isEvent(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && !targetSearchParams.has('view')
  },

  toEventEdit(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'edit')
    return this.toUrl(location.pathname, targetSearchParams.toString())
  },

  isEventEdit(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'edit'
  },

  toEventAttendees(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'attendees')
    return this.toUrl(location.pathname, targetSearchParams.toString())
  },

  isEventAttendees(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'attendees'
  },

  toEventShare(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'share')
    return this.toUrl(location.pathname, targetSearchParams.toString())
  },

  isEventShare(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'share'
  },
}