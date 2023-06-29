import React from "react"

import Menu from "decentraland-gatsby/dist/components/User/UserMenu"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import { useProfileSettingsContext } from "events-web/src/context/ProfileSetting"
import {
  canEditAnyProfile,
  canEditAnySchedule,
} from "events-web/src/entities/ProfileSettings/utils"
import locations from "events-web/src/modules/locations"
import MenuItem from "semantic-ui-react/dist/commonjs/collections/Menu/MenuItem"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon/Icon"

const handleClickUsers = () => navigate(locations.users())
const handleClickSettings = () => navigate(locations.settings())
const handleClickSchedules = () => navigate(locations.schedules())
const handleClickDocs = () => navigate(locations.docs())

export default React.memo(function UserMenu() {
  const l = useFormatMessage()
  const [settings] = useProfileSettingsContext()

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
          {canEditAnySchedule(settings) && (
            <MenuItem onClick={handleClickSchedules}>
              <Icon name="calendar alternate" />
              {l("user_menu.schedules")}
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
