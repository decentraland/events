import { EventCategoryAttributes } from "./types"
import { Model } from "decentraland-gatsby/dist/entities/Database/model"

export default class EventCategoryModel extends Model<EventCategoryAttributes> {
  static tableName = "event_categories"
  static primaryKey = "name"
}
