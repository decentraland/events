
import { Model, SQL } from 'decentraland-server'
import schema from 'decentraland-gatsby/dist/entities/Schema'
import { ProfileSettingsAttributes, profileSettingsSchema } from './types'
import isEthereumAddress from 'validator/lib/isEthereumAddress'
import isEmail from 'validator/lib/isEmail'
import { table } from 'console'
import { values } from 'decentraland-gatsby/dist/entities/Database/utils'

export default class ProfileSettingsModel extends Model<ProfileSettingsAttributes> {
  static tableName = 'profile_settings'
  static primaryKey = 'user'
  static withTimestamps = false
  static validator = schema.compile(profileSettingsSchema)

  static async findByUsers(users: string[]) {
    if (users.length === 0) {
      return []
    }

    const query = SQL`SELECT * FROM ${table(ProfileSettingsModel)} WHERE user IN ${values(users)}`
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
      await this.update<ProfileSettingsAttributes>({ notify_by_email: false }, { user })
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
      await this.update<ProfileSettingsAttributes>({ email_verified: true }, { user })
    }

    return true
  }

  static validate(event: ProfileSettingsAttributes): string[] | null {
    if (!this.isValid(event) && this.validator.errors && this.validator.errors.length > 0) {
      return this.validator.errors
        .map((error) => `${error.dataPath.slice(1)} ${error.message!}`)
        .filter(Boolean)
    }

    return null
  }

  static isValid(event: Partial<ProfileSettingsAttributes>) {
    return this.validator(event) as boolean
  }
}