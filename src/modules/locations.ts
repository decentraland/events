import API from "decentraland-gatsby/dist/utils/api/API"

import { ToggleItemsValue } from "../entities/Event/types"

const GATSBY_BASE_URL = process.env.GATSBY_BASE_URL || "/"

export enum EventView {
  Attendees = "attendees",
}

export enum SubmitView {
  Edit = "edit",
  Clone = "clone",
}

export function url(
  path: string,
  query?: Record<string, string> | URLSearchParams
) {
  return API.url(GATSBY_BASE_URL, path, query)
}

export default {
  events: (
    filters:
      | Partial<{ search: string; type: ToggleItemsValue }>
      | URLSearchParams = {}
  ) => url("/", filters),
  event: (id: string) => url("/event/", { id }),
  myEvents: () => url("/me/"),
  pendingEvents: () => url("/pending/"),
  schedule: (id: string) => url("/schedule/", { id }),

  submit: () => url("/submit/"),
  edit: (event: string) => url("/submit/", { event, view: SubmitView.Edit }),
  clone: (event: string) => url("/submit/", { event, view: SubmitView.Clone }),

  settings: () => url("/settings/"),

  docs: () => url("/docs/"),
}
