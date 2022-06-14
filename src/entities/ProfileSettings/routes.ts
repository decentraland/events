import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"

import { createProfileSettings } from "./routes/createProfileSettings"
import { getMyProfileSettings } from "./routes/getMyProfileSettings"
import { getProfileSettings } from "./routes/getProfileSettings"
import { updateMyProfileSettings } from "./routes/updateMyProfileSettings"
import { updateProfileSettings } from "./routes/updateProfileSettings"

export default routes((router) => {
  const withAuth = auth()
  router.get("/profiles/settings", withAuth, handle(getMyProfileSettings))
  router.patch("/profiles/settings", withAuth, handle(updateMyProfileSettings))
  router.get(
    "/profiles/:profile_id/settings",
    withAuth,
    handle(getProfileSettings)
  )
  router.post(
    "/profiles/:profile_id/settings",
    withAuth,
    handle(createProfileSettings)
  )
  router.patch(
    "/profiles/:profile_id/settings",
    withAuth,
    handle(updateProfileSettings)
  )
})
