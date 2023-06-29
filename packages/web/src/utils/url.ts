export default {
  toUrl(pathname: string, params = "", hash = "") {
    if (pathname.slice(-1) !== "/") {
      pathname = pathname + "/"
    }

    if (params && params[0] !== "?") {
      params = "?" + params
    }

    if (hash && hash[0] !== "#") {
      hash = "#" + hash
    }

    return pathname + params + hash
  },

  toMyEvents() {
    return this.toUrl("/me")
  },

  toSubmit() {
    return this.toUrl("/submit")
  },

  toSettings() {
    return this.toUrl("/settings")
  },

  toHome(location: Location) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.delete("event")
    targetSearchParams.delete("view")
    return this.toUrl("/", targetSearchParams.toString())
  },

  isHome(location: Location) {
    const targetSearchParams = new URLSearchParams(location.search)
    return !targetSearchParams.has("event") && !targetSearchParams.has("view")
  },

  toEvent(location: Location, eventId: string, myEvents = false) {
    const path = myEvents ? "/me/" : "/"
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set("event", eventId)
    targetSearchParams.delete("view")
    return this.toUrl(path, targetSearchParams.toString())
  },

  isEvent(location: Location) {
    const targetSearchParams = new URLSearchParams(location.search)
    return targetSearchParams.has("event") && !targetSearchParams.has("view")
  },

  getEventId(location: Location) {
    const searchParams = new URLSearchParams(location.search)
    return (location && searchParams.get("event")) || null
  },

  toEventEdit(location: Location, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set("event", eventId)
    targetSearchParams.set("view", "edit")
    return this.toUrl("/submit", targetSearchParams.toString())
  },

  isEventEdit(location: Location) {
    const targetSearchParams = new URLSearchParams(location.search)
    return (
      targetSearchParams.has("event") &&
      targetSearchParams.get("view") === "edit"
    )
  },

  toEventClone(location: Location, eventId: string) {
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set("event", eventId)
    targetSearchParams.set("view", "clone")
    return this.toUrl("/submit", targetSearchParams.toString())
  },

  isEventClone(location: Location) {
    const targetSearchParams = new URLSearchParams(location.search)
    return (
      targetSearchParams.has("event") &&
      targetSearchParams.get("view") === "clone"
    )
  },

  toEventAttendees(location: Location, eventId: string, myEvents = false) {
    const path = myEvents ? "/me/" : "/"
    const targetSearchParams = new URLSearchParams(location.search)
    targetSearchParams.set("event", eventId)
    targetSearchParams.set("view", "attendees")
    return this.toUrl(path, targetSearchParams.toString())
  },

  isEventAttendees(location: Location) {
    const targetSearchParams = new URLSearchParams(location.search)
    return (
      targetSearchParams.has("event") &&
      targetSearchParams.get("view") === "attendees"
    )
  },
}
