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

  myEvents: () => url('/me/'),
  myEvent: (event: string) => url('/me/', { event }),

  pendingEvents: () => url('/pending/'),
  pendingEvent: (event: string) => url('/pending/', { event }),

  submit: () => url('/submit/'),
  edit: (event: string) => url('/submit/', { event, view: SubmitView.Edit }),
  clone: (event: string) => url('/submit/', { event, view: SubmitView.Clone }),

  settings: () => url('/settings/'),
}