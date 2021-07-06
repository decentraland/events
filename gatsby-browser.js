/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// You can delete this file if you're not using it
import React from "react"
import { navigate } from "gatsby-plugin-intl"
import 'semantic-ui-css/semantic.min.css'
import 'balloon-css/balloon.min.css'
import 'decentraland-ui/dist/themes/base-theme.css'
import 'decentraland-ui/dist/themes/alternative/light-theme.css'
import './src/theme.css'

// import Helmet from "react-helmet"
import AuthProvider from "decentraland-gatsby/dist/context/Auth/AuthProvider"
// import FeatureFlagProvider from "decentraland-gatsby/dist/context/FeatureFlag/FeatureFlagProvider"
import Layout from "decentraland-gatsby/dist/components/Layout/Layout"
import UserMenu from "decentraland-gatsby/dist/components/User/UserMenu"
import segment from "decentraland-gatsby/dist/utils/development/segment"
import MenuItem from "semantic-ui-react/dist/commonjs/collections/Menu/MenuItem"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon/Icon"
import ProfileSettings from './src/context/ProfileSetting'
import Events from './src/context/Event'
import locations from './src/modules/locations'

export const registerServiceWorker = () => true

export const wrapRootElement = ({ element }) => (<>
  <AuthProvider>
    <ProfileSettings>
      <Events>
        {/* <FeatureFlagProvider endpoint="https://feature-flags.decentraland.org/events.json"> */}
          {element}
        {/* </FeatureFlagProvider> */}
      </Events>
    </ProfileSettings>
  </AuthProvider>
</>)

export const wrapPageElement = ({ element, props }) => {
  return <Layout
    {...props}
    rightMenu={<UserMenu
      onClickSettings={() => navigate(locations.settings())}
      menuItems={[
        <>
          <MenuItem onClick={() => navigate(locations.docs())}><Icon name="code" />&nbsp;API</MenuItem>
        </>
      ]}
    />}
    >
    {element}
  </Layout>
}

export const onClientEntry = () => {
  segment((analytics) => analytics.page())
}

export const onRouteUpdate = () => {
  segment((analytics) => analytics.page())
}
