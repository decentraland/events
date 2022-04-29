import routes from "decentraland-gatsby/dist/entities/Route/routes"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import EventCategoryModel from "./model"
import { EventCategoryAttributes } from "./types"

export default routes((router) => {
  router.get("/events/categories", handle(getEventCategoryList))
})

export async function getEventCategoryList() {
  return EventCategoryModel.find<EventCategoryAttributes>({active: true})
}
