import {
  ProfilePermissions,
  ProfileSettingsAttributes,
} from "events-type/src/types/ProfileSettings"

export function canEditAnyProfile(
  settings: Pick<ProfileSettingsAttributes, "permissions">
) {
  return settings.permissions.includes(ProfilePermissions.EditAnyProfile)
}

export function canApproveAnyEvent(settings: ProfileSettingsAttributes) {
  return settings.permissions.includes(ProfilePermissions.ApproveAnyEvent)
}

export function canApproveOwnEvent(settings: ProfileSettingsAttributes) {
  return settings.permissions.includes(ProfilePermissions.ApproveOwnEvent)
}

export function canEditAnyEvent(settings: ProfileSettingsAttributes) {
  return settings.permissions.includes(ProfilePermissions.EditAnyEvent)
}

export function canTestAnyNotification(settings: ProfileSettingsAttributes) {
  return settings.permissions.includes(ProfilePermissions.EditAnyEvent)
}

export function canEditAnySchedule(settings: ProfileSettingsAttributes) {
  return settings.permissions.includes(ProfilePermissions.EditAnySchedule)
}
