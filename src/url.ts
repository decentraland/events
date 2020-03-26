import { Location as HLocation } from 'history';

export type WindowLocation = Window['location'] & HLocation;

export default {
  toHome(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.delete('event')
    targetSearchParams.delete('view')
    return (location.pathname + '?' + targetSearchParams.toString())
  },

  isHome(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return !targetSearchParams.has('event') && !targetSearchParams.has('view')
  },

  toEvent(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.delete('view')
    return (location.pathname + '?' + targetSearchParams.toString())
  },

  isEvent(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && !targetSearchParams.has('view')
  },

  toEventAttendees(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'attendees')
    return (location.pathname + '?' + targetSearchParams.toString())
  },

  isEventAttendees(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'attendees'
  },

  toEventShare(location: WindowLocation, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set('event', eventId)
    targetSearchParams.set('view', 'share')
    return (location.pathname + '?' + targetSearchParams.toString())
  },

  isEventShare(location: WindowLocation) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has('event') && targetSearchParams.get('view') === 'share'
  },
}