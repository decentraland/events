"use strict"

self.addEventListener("push", function (event) {
  const data = (event.data && event.data.json()) || {}
  const exp = data.exp || Infinity
  if (Date.now() > exp) {
    return
  }

  const title = data.title || "Event upcoming"
  const options = {
    body: "Event is about to start",
    tag: "unknown",
    renotify: true,
    requireInteraction: false,
    icon: "icons/icon-192x192.png",
    badge: "icons/icon-192x192.png",
    image: "https://api.decentraland.org/v1/estates/1164/map.png",
    data,
  }

  const props = [
    "actions",
    "badge",
    "body",
    "dir",
    "image",
    "lang",
    "renotify",
    "requireInteraction",
    "tag",
    "timestamp",
    "vibrate",
  ]

  for (const prop of props) {
    if (prop in data) {
      options[props] = data[props]
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const data = event.notification.data || {}
  if (data.href) {
    event.waitUntil(clients.openWindow(data.href))
  }
})
