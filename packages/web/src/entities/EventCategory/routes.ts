import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { EventCategoryAttributes } from "events-type/src/types/EventCategory"

import EventCategoryModel from "./model"

export default routes((router) => {
  const withPublicAccess = withCors({ cors: "*" })
  router.get(
    "/events/categories",
    withPublicAccess,
    handle(getEventCategoryList)
  )
})

export async function getEventCategoryList() {
  return await EventCategoryModel.find<EventCategoryAttributes>(
    { active: true },
    { name: "asc" }
  )
}
