import routes from "decentraland-gatsby/dist/entities/Route/routes"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import EventCategoryModel from "./model"
import { EventCategoryAttributes } from "./types"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"

export default routes((router) => {
  const withPublicAccess = withCors({ cors: "*" })
  router.get(
    "/events_categories",
    withPublicAccess,
    handle(getEventCategoryList)
  )
})

export async function getEventCategoryList() {
  return EventCategoryModel.find<EventCategoryAttributes>({active: true})
}
