import React from "react"

import Layout1 from "decentraland-gatsby/dist/components/Layout/Layout"
import Layout2 from "decentraland-gatsby/dist/components/Layout/Layout2"
import UserInformation from "decentraland-gatsby/dist/components/User/UserInformation"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"

export default function Layout(props: any) {
  const [ff] = useFeatureFlagContext()
  const isNewMenu = ff.flags["dapps-navbar2_variant"]
  if (isNewMenu) {
    return <Layout2 {...props} activePage="explore" />
  }
  return (
    <Layout1
      {...props}
      rightMenu={<UserInformation />}
      activePage="events"
      isFullScreen={true}
    />
  )
}
