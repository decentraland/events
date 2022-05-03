import { EventCategoryAttributes } from "./types"
import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import { SQL, table, values } from "decentraland-gatsby/dist/entities/Database/utils"

export default class EventCategoryModel extends Model<EventCategoryAttributes> {
  static tableName = "event_categories"
  static primaryKey = "name"
}

export type countQuery = {count: number}

export const validateCategories = async (categories: string[]) => {

  const query = SQL`SELECT count(*) FROM ${table(
    EventCategoryModel
  )} WHERE "name" IN ${values(categories)}`
  const categoriesFound = await EventCategoryModel.query<countQuery>(query)
  
  return categoriesFound[0].count == categories.length
}