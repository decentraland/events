// import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"
import { ProfilePermissions, ProfileSettingsAttributes } from "./types"

export function canEditAnyProfile(
  settings: Pick<ProfileSettingsAttributes, "permissions">
) {
  return (
    // isAdmin(settings.user) ||
    settings.permissions.includes(ProfilePermissions.EditAnyProfile)
  )
}

export function canApproveAnyEvent(settings: ProfileSettingsAttributes) {
  return (
    // isAdmin(settings.user) ||
    settings.permissions.includes(ProfilePermissions.ApproveAnyEvent)
  )
}

export function canApproveOwnEvent(settings: ProfileSettingsAttributes) {
  return (
    // isAdmin(settings.user) ||
    settings.permissions.includes(ProfilePermissions.ApproveOwnEvent)
  )
}

export function canEditAnyEvent(settings: ProfileSettingsAttributes) {
  return (
    // isAdmin(settings.user) ||
    settings.permissions.includes(ProfilePermissions.EditAnyEvent)
  )
}

export function canTestAnyNotification(settings: ProfileSettingsAttributes) {
  return (
    // isAdmin(settings.user) ||
    settings.permissions.includes(ProfilePermissions.EditAnyEvent)
  )
}
