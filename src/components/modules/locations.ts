import API from 'decentraland-gatsby/dist/utils/api/API'

const GATSBY_BASE_URL = process.env.GATSBY_BASE_URL || '/'

export enum EventView {
  Attendees = 'attendees',
}

export enum SubmitView {
  Edit = 'edit',
  Clone = 'clone',
}

function url(path: string, query?: Record<string, string> | URLSearchParams) {
  return API.url(GATSBY_BASE_URL, path, query)
}

export default {
  events: () => url('/'),
  event: (event: string) => url('/', { event }),
  eventAttendees: (event: string) => url('/', { event, view: EventView.Attendees }),

  myEvents: () => url('/me/'),
  myEvent: (event: string) => url('/me/', { event }),
  myEventAttendees: (event: string) => url('/me/', { event, view: EventView.Attendees }),

  submit: () => url('/submit/'),
  edit: (event: string) => url('/submit/', { event, view: SubmitView.Edit }),
  clone: (event: string) => url('/submit/', { event, view: SubmitView.Clone }),

  settings: () => url('/settings/'),
}