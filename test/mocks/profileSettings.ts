import ProfileSettingsModel from "../../src/entities/ProfileSettings/model"
import { ProfilePermissions } from "../../src/entities/ProfileSettings/types"

export async function seedProfileSettings(
  user: string,
  permissions: ProfilePermissions[]
): Promise<void> {
  await ProfileSettingsModel.create({
    user: user.toLowerCase(),
    email: null,
    email_verified: false,
    email_verified_at: null,
    email_updated_at: null,
    use_local_time: true,
    notify_by_email: false,
    notify_by_browser: false,
    permissions,
    created_at: new Date(),
    updated_at: new Date(),
  })
}
