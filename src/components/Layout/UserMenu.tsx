import React from "react"

import UserInformation from "decentraland-gatsby/dist/components/User/UserInformation"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"

import locations from "../../modules/locations"

const handleClickSettings = () => navigate(locations.settings())

export default React.memo(function UserMenu() {
  return (
    <UserInformation
      onClickSettings={handleClickSettings}
      hasActivity={false}
    />
  )
})
