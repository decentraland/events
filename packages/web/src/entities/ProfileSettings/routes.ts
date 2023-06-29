import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"

import { getAuthProfileSettings } from "./routes/getAuthProfileSettings"
import { getProfileSettings } from "./routes/getProfileSettings"
import { listProfileSettings } from "./routes/listProfileSettings"
import { updateMyProfileSettings } from "./routes/updateMyProfileSettings"
import { updateProfileSettings } from "./routes/updateProfileSettings"

export default routes((router) => {
  const withAuth = auth()
  router.get("/profiles/settings", withAuth, handle(listProfileSettings))
  router.get("/profiles/me/settings", withAuth, handle(getAuthProfileSettings))
  router.patch(
    "/profiles/me/settings",
    withAuth,
    handle(updateMyProfileSettings)
  )
  router.get(
    "/profiles/:profile_id/settings",
    withAuth,
    handle(getProfileSettings)
  )
  router.patch(
    "/profiles/:profile_id/settings",
    withAuth,
    handle(updateProfileSettings)
  )
})
