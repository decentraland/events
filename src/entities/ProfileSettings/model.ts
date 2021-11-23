import { ProfileSettingsAttributes } from "./types"
import isEthereumAddress from "validator/lib/isEthereumAddress"
import isEmail from "validator/lib/isEmail"
import {
  SQL,
  table,
  values,
} from "decentraland-gatsby/dist/entities/Database/utils"
import { Model } from "decentraland-gatsby/dist/entities/Database/model"

export default class ProfileSettingsModel extends Model<ProfileSettingsAttributes> {
  static tableName = "profile_settings"
  static primaryKey = "user"
  static withTimestamps = false

  static async findByUsers(users: string[]) {
    if (users.length === 0) {
      return []
    }

    const query = SQL`SELECT * FROM ${table(
      ProfileSettingsModel
    )} WHERE "user" IN ${values(users)}`
    return this.query<ProfileSettingsAttributes>(query)
  }

  static async unsubscribe(user: string, email: string) {
    if (!isEthereumAddress(user) || !isEmail(email)) {
      return false
    }

    const profile = await this.findOne<ProfileSettingsAttributes>({ user })
    if (!profile) {
      return false
    }

    if (profile.email !== email) {
      return false
    }

    if (!profile.notify_by_email) {
      await this.update<ProfileSettingsAttributes>(
        { notify_by_email: false },
        { user }
      )
    }

    return true
  }

  static async verify(user: string, email: string) {
    if (!isEthereumAddress(user) || !isEmail(email)) {
      return false
    }

    const profile = await this.findOne<ProfileSettingsAttributes>({ user })
    if (!profile) {
      return false
    }

    if (profile.email !== email) {
      return false
    }

    if (!profile.email_verified) {
      await this.update<ProfileSettingsAttributes>(
        {
          email_verified: true,
          notify_by_email: true,
          email_verified_at: new Date(),
        },
        { user }
      )
    }

    return true
  }
}
