import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import {
  SQL,
  table,
  values,
} from "decentraland-gatsby/dist/entities/Database/utils"
import { EventCategoryAttributes } from "events-type/src/types/EventCategory"

export default class EventCategoryModel extends Model<EventCategoryAttributes> {
  static tableName = "event_categories"
  static primaryKey = "name"

  static validateCategories = async (categories: string[]) => {
    const query = SQL`SELECT count(*) FROM ${table(
      EventCategoryModel
    )} WHERE "name" IN ${values(categories)}`
    const categoriesFound = await EventCategoryModel.query<{ count: number }>(
      query
    )

    return categoriesFound[0].count == categories.length
  }
}
