import React, { useCallback } from "react"
import Menu from "decentraland-gatsby/dist/components/User/UserMenu"
import MenuItem from "semantic-ui-react/dist/commonjs/collections/Menu/MenuItem"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon/Icon"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import locations from "../../modules/locations"
import { useProfileSettingsContext } from "../../context/ProfileSetting"
import { canEditAnyProfile } from "../../entities/ProfileSettings/utils"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

export default React.memo(function UserMenu() {
  const l = useFormatMessage()
  const [settings] = useProfileSettingsContext()
  const handleClickUsers = useCallback(() => navigate(locations.users()), [])
  const handleClickSettings = useCallback(
    () => navigate(locations.settings()),
    []
  )
  const handleClickDocs = useCallback(() => navigate(locations.docs()), [])

  return (
    <Menu
      onClickSettings={handleClickSettings}
      hasActivity={false}
      onClickActivity={undefined as any}
      onClickProfile={undefined as any}
      menuItems={
        <>
          {canEditAnyProfile(settings) && (
            <MenuItem onClick={handleClickUsers}>
              <Icon name="users" />
              {l("user_menu.users")}
            </MenuItem>
          )}
          <MenuItem onClick={handleClickDocs}>
            <Icon name="code" />
            {l("user_menu.api")}
          </MenuItem>
        </>
      }
    />
  )
})
