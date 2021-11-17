
import { ProfileSubscriptionAttributes } from './types'
import isEthereumAddress from 'validator/lib/isEthereumAddress'
import { SQL, table, values } from 'decentraland-gatsby/dist/entities/Database/utils'
import { Model } from 'decentraland-gatsby/dist/entities/Database/model'

export default class ProfileSubscriptionModel extends Model<ProfileSubscriptionAttributes> {
  static tableName = 'profile_subscriptions'
  static primaryKey = 'endpoint'
  static withTimestamps = false

  static async deleteAll(subscriptions: ProfileSubscriptionAttributes[]) {
    if (subscriptions.length === 0) {
      return []
    }

    const endpoints = subscriptions.map(sub => sub.endpoint)
    const query = SQL`DELETE FROM ${table(ProfileSubscriptionModel)} WHERE "endpoint" IN ${values(endpoints)}`
    return this.query<ProfileSubscriptionAttributes>(query)
  }

  static async findByUsers(users: string[]) {
    if (users.length === 0) {
      return []
    }

    const query = SQL`SELECT * FROM ${table(ProfileSubscriptionModel)} WHERE "user" IN ${values(users)}`
    return this.query<ProfileSubscriptionAttributes>(query)
  }

  static async findByUser(user: string) {
    if (!isEthereumAddress(user)) {
      return []
    }

    const subscriptions = await this.find<ProfileSubscriptionAttributes>({ user })
    return subscriptions.map((subscriptions) => subscriptions.endpoint)
  }
}