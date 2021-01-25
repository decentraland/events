
import React from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import Layout from "../components/Layout/Layout"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubmitButton from "../components/Button/SubmitButton"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../utils/segment'
import useAnalytics from "../hooks/useAnalytics"
import { ProfileSettingsAttributes, EmailSubscriptionStatus } from "../entities/ProfileSettings/types"

import './settings.css'

export type SettingsPageState = {
  updating: Partial<{
    webNotification: boolean,
    emailNotification: boolean,
    useLocalTime: boolean,
    email: boolean,
  }>,
  settings: Partial<ProfileSettingsAttributes>
}

export default function SettingsPage(props: any) {
  const location = useLocation()
  const siteStore = useSiteStore(props.location)
  const params = new URLSearchParams(location.search)
  const unsubscribe = params.get('unsubscribe')
  const verify = params.get('verify')
  const ok = String(EmailSubscriptionStatus.OK)
  const expired = String(EmailSubscriptionStatus.Expired)
  const invalid = String(EmailSubscriptionStatus.Invalid)

  const title = "Decentraland Events"
  const path = url.toUrl(location.pathname, location.search)

  useAnalytics((analytics) => analytics.page(segment.Page.Confirm, { title, path }))

  function handleSubmit(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    navigate(url.toSubmit(location), siteStore.getNavigationState())
  }

  function handleHome(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    navigate(url.toHome(location), siteStore.getNavigationState())
  }

  function handleMyEvents(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    navigate(url.toMyEvents(location), siteStore.getNavigationState())
  }

  return (
    <Layout {...props} title={title} active>
      <div style={{ paddingTop: "75px" }} />
      <Tabs>
        <Tabs.Tab onClick={handleHome}>World Events</Tabs.Tab>
        {siteStore.profile && <Tabs.Tab onClick={handleMyEvents}>My Events</Tabs.Tab>}
        <SubmitButton onClick={handleSubmit} />
      </Tabs>
      <Container className="SettingsPage">
        {siteStore.loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}
        {!siteStore.loading && verify === ok && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>Your email was verified</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && unsubscribe === ok && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>Your subscription was canceled</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && (verify === expired || unsubscribe === expired) && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>Invalid token</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && (verify === invalid || unsubscribe === invalid) && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>This link expired</Paragraph>
          <Divider />
        </div>}
      </Container>
    </Layout>
  )
}
