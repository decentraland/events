import routes from "decentraland-gatsby/dist/entities/Route/routes"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { updateProfileSettings } from "./routes/updateProfileSettings"
import { updateMyProfileSettings } from "./routes/updateMyProfileSettings"
import { createProfileSettings } from "./routes/createProfileSettings"
import { getProfileSettings } from "./routes/getProfileSettings"
import { getMyProfileSettings } from "./routes/getMyProfileSettings"

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
