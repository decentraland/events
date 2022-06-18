import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"

import { updateProfileSettings } from "./routes/updateProfileSettings"
import { updateMyProfileSettings } from "./routes/updateMyProfileSettings"
import { getProfileSettings } from "./routes/getProfileSettings"
import { getMyProfileSettings } from "./routes/getMyProfileSettings"
import { listProfileSettings } from "./routes/listProfileSettings"

export default routes((router) => {
  const withAuth = auth()
  router.get("/profiles/settings", withAuth, handle(listProfileSettings))
  router.get("/profiles/me/settings", withAuth, handle(getMyProfileSettings))
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
