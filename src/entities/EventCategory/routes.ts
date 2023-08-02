import handle from "decentraland-gatsby/dist/entities/Route/handle"
import { withCors } from "decentraland-gatsby/dist/entities/Route/middleware"
import routes from "decentraland-gatsby/dist/entities/Route/routes"

import { categories } from "./i18n"
import EventCategoryModel from "./model"
import { EventCategoryAttributes } from "./types"

export default routes((router) => {
  const withPublicAccess = withCors({ cors: "*" })
  router.get(
    "/events/categories",
    withPublicAccess,
    handle(getEventCategoryList)
  )
})

export async function getEventCategoryList() {
  return (
    await EventCategoryModel.find<EventCategoryAttributes>(
      { active: true },
      { name: "asc" }
    )
  ).map((category) => ({
    ...category,
    i18n: {
      en: categories.en[category.name],
    },
  }))
}
