/* import {
  registerCatalystImmutableFiles,
  registerGatsbyImmutableFiles,
  registerImmutableFiles,
} from "decentraland-gatsby/dist/utils/webworker/cache"
import { registerNotification } from "decentraland-gatsby/dist/utils/webworker/notification"

registerNotification({
  body: "Event is about to start",
  tag: "unknown",
  renotify: true,
  requireInteraction: false,
  icon: "icons/icon-192x192.png",
  badge: "icons/icon-192x192.png",
  image: "https://api.decentraland.org/v1/estates/1164/map.png",
})

registerGatsbyImmutableFiles()
registerCatalystImmutableFiles()
registerImmutableFiles(
  ({ url }) =>
    self.location.hostname === url.hostname &&
    url.pathname.startsWith("/poster/")
)
 */
