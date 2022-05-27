/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */
// You can delete this file if you're not using it
import React from "react"

import "balloon-css/balloon.min.css"
import "core-js/features/set-immediate"
import "semantic-ui-css/semantic.min.css"
import MenuItem from "semantic-ui-react/dist/commonjs/collections/Menu/MenuItem"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon/Icon"

import Layout from "decentraland-gatsby/dist/components/Layout/Layout"
import UserMenu from "decentraland-gatsby/dist/components/User/UserMenu"
import AuthProvider from "decentraland-gatsby/dist/context/Auth/AuthProvider"
import FeatureFlagProvider from "decentraland-gatsby/dist/context/FeatureFlag/FeatureFlagProvider"
// import Helmet from 'react-helmet'
// import { RawIntlProvider, createIntl } from 'react-intl'
import { IntlProvider, navigate } from "decentraland-gatsby/dist/plugins/intl"
import segment from "decentraland-gatsby/dist/utils/development/segment"
import "decentraland-ui/dist/themes/alternative/light-theme.css"
import "decentraland-ui/dist/themes/base-theme.css"

import Events from "./src/context/Event"
import ProfileSettings from "./src/context/ProfileSetting"
import locations from "./src/modules/locations"
import "./src/theme.css"

export const registerServiceWorker = () => true

export const wrapRootElement = ({ element }) => (
  <AuthProvider>
    <FeatureFlagProvider endpoint="https://feature-flags.decentraland.org/events.json">
      <ProfileSettings>
        <Events>{element}</Events>
      </ProfileSettings>
    </FeatureFlagProvider>
  </AuthProvider>
)

export const wrapPageElement = ({ element, props }) => {
  return (
    <IntlProvider {...props.pageContext.intl}>
      <Layout
        {...props}
        rightMenu={
          <UserMenu
            onClickSettings={() => navigate(locations.settings())}
            menuItems={
              <>
                <MenuItem onClick={() => navigate(locations.docs())}>
                  <Icon name="code" />
                  &nbsp;API
                </MenuItem>
              </>
            }
          />
        }
      >
        {element}
      </Layout>
    </IntlProvider>
  )
}

export const onClientEntry = () => {
  segment((analytics) => analytics.page())
}

export const onRouteUpdate = () => {
  segment((analytics) => analytics.page())
}
