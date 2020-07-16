
import React, { useMemo, useEffect, useState } from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import Layout from "../components/Layout/Layout"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Field } from "decentraland-ui/dist/components/Field/Field"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import useFeatureDetection from "decentraland-gatsby/dist/hooks/useFeatureDetection"

import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"

import useListEvents from '../hooks/useListEvents'
import WalletRequiredModal from "../components/Modal/WalletRequiredModal"
import SubmitButton from "../components/Button/SubmitButton"
import SEO from "../components/seo"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../utils/segment'
import useAnalytics from "../hooks/useAnalytics"
import { ProfileSettingsAttributes } from "../entities/ProfileSettings/types"

import Section from "../components/Text/Section"

import './settings.css'
import TokenList from "decentraland-gatsby/dist/utils/TokenList"
import { fromWebPushKey, toBase64 } from "decentraland-gatsby/dist/utils/base64"
import usePushSubscription from "../hooks/usePushSubscription"
import Events from "../api/Events"
import API from "decentraland-gatsby/dist/utils/api/API"
import isEmail from "validator/lib/isEmail"
import track from "decentraland-gatsby/dist/components/Segment/track"

export type SettingsPageState = {
  updating: Partial<{
    webNotification: boolean,
    emailNotification: boolean,
    useLocalTime: boolean,
    email: boolean,
  }>,
  settings: Partial<ProfileSettingsAttributes>
}

const check = require('../images/check.svg')

export default function SettingsPage(props: any) {
  const location = useLocation()
  const eventId = url.getEventId(location)
  const siteStore = useSiteStore(props.location)
  const events = useListEvents(siteStore.events.getState().data)
  const currentEvent = eventId && siteStore.events.getEntity(eventId) || null
  const notificationSupported = useFeatureDetection("Notification")
  const serviceWorkerSupported = useFeatureDetection("ServiceWorker")
  const pushSupported = useFeatureDetection("PushManager")
  const pushNotificationSupported = notificationSupported && serviceWorkerSupported && pushSupported
  const [subscription, subscribe, unsubscribe] = usePushSubscription()
  const [state, patchState] = usePatchState<SettingsPageState>({ updating: {}, settings: { ...siteStore.settings } })
  const currentEmail = state.settings.email || ''
  const currentEmailChanged = currentEmail !== (siteStore.settings?.email || '')
  const currentEmailIsValid = isEmail(currentEmail)

  const [requireWallet, setRequireWallet] = useState(false)
  useEffect(() => {
    if (siteStore.connectError === 'CONNECT_ERROR') {
      setRequireWallet(true)
    }
  }, [siteStore.connectError])

  useEffect(() => {
    if (siteStore.settings) {
      patchState({ settings: { ...siteStore.settings } })
    }
  }, [siteStore.settings])

  const title = currentEvent && currentEvent.name || "Decentraland Events"
  const path = url.toUrl(location.pathname, location.search)

  useAnalytics((analytics) => analytics.page(segment.Page.Settings, { title, path }))

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

  function handleChangeEmail(event: any, data: any) {
    const value = data.value || ''
    patchState({ settings: { ...state.settings, email: value } })
  }

  function handleSaveEmail() {
    if (!currentEmailIsValid) {
      return
    }

    patchState({ updating: { ...state.updating, email: true } })
    siteStore
      .updateSettings({ email: currentEmail })
      .then((settings) => settings && track((analytics) => analytics.track(segment.Track.Settings, settings)))
      .then(() => patchState({ updating: { ...state.updating, email: false } }))
  }

  function handleChangeUseLocalTime() {
    patchState({ updating: { ...state.updating, useLocalTime: true } })
    siteStore
      .updateSettings({ use_local_time: !state.settings.use_local_time })
      .then((settings) => settings && track((analytics) => analytics.track(segment.Track.Settings, settings)))
      .then(() => patchState({ updating: { ...state.updating, useLocalTime: false } }))
  }

  function handleChangeEmailNotification() {
    if (!state.settings.email_verified) {
      return
    }

    patchState({ updating: { ...state.updating, emailNotification: true } })
    siteStore
      .updateSettings({ notify_by_email: !state.settings.notify_by_email })
      .then((settings) => settings && track((analytics) => analytics.track(segment.Track.Settings, settings)))
      .then(() => patchState({ updating: { ...state.updating, emailNotification: false } }))
  }

  function handleChangeBrowserNotification() {
    if (state.updating.webNotification) {
      return
    }

    if (!Notification || !Notification.permission || Notification.permission === "denied") {
      return
    }

    patchState({ updating: { ...state.updating, webNotification: true } })
    if (!subscription) {
      API.catch(Notification.requestPermission()
        .then(async (permission) => permission === 'granted' && subscribe() || null)
        .then(async (subscription) => {
          const options = subscription && {
            endpoint: subscription.endpoint,
            p256dh: toBase64(subscription.getKey('p256dh') as any),
            auth: toBase64(subscription.getKey('auth') as any),
          }

          siteStore.updateSubscription(options)
        })
      )
        .then(() => patchState({ updating: { ...state.updating, webNotification: false } }))
    } else {
      siteStore.updateSubscription(null)
        .then(() => unsubscribe())
        .then(() => patchState({ updating: { ...state.updating, webNotification: false } }))
    }
  }

  return (
    <Layout {...props} active>
      <SEO title={title} />
      <WalletRequiredModal open={requireWallet} onClose={() => setRequireWallet(false)} />
      <div style={{ paddingTop: "75px" }} />
      <Tabs>
        <Tabs.Tab onClick={handleHome}>World Events</Tabs.Tab>
        <Tabs.Tab onClick={handleMyEvents}>My Events</Tabs.Tab>
        <SubmitButton onClick={handleSubmit} />
      </Tabs>
      <Container className="SettingsPage">
        {siteStore.loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}
        {!siteStore.loading && !siteStore.profile && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>You need to <Link onClick={() => siteStore.connect()}>sign in</Link> before to submit an event</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && siteStore.profile && events.length === 0 && <div>
          <Divider />
          <Paragraph secondary style={{ textAlign: 'center' }}>No events planned yet.</Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && siteStore.profile && events.length > 0 && <Grid style={{ paddingTop: '4rem' }}>
          <Grid.Row>
            <Grid.Column tablet="4">
              <Section uppercase>Profile</Section>
            </Grid.Column>
            <Grid.Column tablet="8">
              <Paragraph small secondary style={{ margin: 0 }}>Email</Paragraph>
              <Paragraph small semiBold>Add you email address to receive notifications and our weekly digest</Paragraph>
              <div className="AddonField">
                <Field label="Email address" placeholder="example@domain.com" value={currentEmail} onChange={handleChangeEmail} />
                {currentEmailChanged && <Button basic loading={state.updating.email} disabled={!currentEmailIsValid} onClick={handleSaveEmail}>SAVE</Button>}
                {!currentEmailChanged && siteStore.settings && siteStore.settings.email && siteStore.settings.email_verified && <Button basic>Verified <img src={check} width={18} height={18} /></Button>}
                {!currentEmailChanged && siteStore.settings && siteStore.settings.email && !siteStore.settings.email_verified && <Button basic disabled>Pending</Button>}
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
        {!siteStore.loading && siteStore.profile && events.length > 0 && <Grid style={{ paddingTop: '4rem' }}>
          <Grid.Row>
            <Grid.Column tablet="4">
              <Section uppercase>Event settings</Section>
            </Grid.Column>
            <Grid.Column tablet="8">
              <Paragraph small secondary>Timezone</Paragraph>
              <div className="SettingsSection">
                <div className="SettingsDetails">
                  <Paragraph small semiBold>Use UTC over local time</Paragraph>
                  <Paragraph tiny secondary>Turn this off if you want to use your computers clock</Paragraph>
                </div>
                <div className="SettingsToggle">
                  {state.updating.useLocalTime && <Loader size="mini" active />}
                  {!state.updating.useLocalTime && <Radio toggle checked={state.settings.use_local_time} onClick={handleChangeUseLocalTime} />}
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
        {!siteStore.loading && siteStore.profile && events.length > 0 && <Grid style={{ paddingTop: '4rem' }}>
          <Grid.Row>
            <Grid.Column tablet="4">
            </Grid.Column>
            <Grid.Column tablet="8">
              <Paragraph small secondary>Notifications</Paragraph>
            </Grid.Column>
            <Grid.Column tablet="4"></Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column tablet="4">
            </Grid.Column>
            <Grid.Column tablet="8">
              <div className="SettingsSection">
                <div className={TokenList.join(["SettingsDetails", !state.settings.email_verified && 'SettingsDetails--disabled'])}>
                  <Paragraph small semiBold>Receive Alerts via Email</Paragraph>
                  <Paragraph primary tiny>10 Minutes before</Paragraph>
                </div>
                <div className="SettingsToggle">
                  {state.updating.emailNotification && <Loader size="mini" active />}
                  {!state.updating.emailNotification && <Radio toggle disabled={!state.settings.email_verified} checked={state.settings.notify_by_email} onClick={handleChangeEmailNotification} />}
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column tablet="4">
            </Grid.Column>
            <Grid.Column tablet="8">
              <div className="SettingsSection">
                <div className={TokenList.join(["SettingsDetails", !pushNotificationSupported && 'SettingsDetails--disabled'])}>
                  <Paragraph small semiBold>Receive Alerts via Browser</Paragraph>
                  <Paragraph tiny secondary>{' '}</Paragraph>
                </div>
                <div className="SettingsToggle">
                  {state.updating.webNotification && <Loader size="mini" active />}
                  {!state.updating.webNotification && <Radio toggle disabled={!pushNotificationSupported} checked={!!subscription} onClick={handleChangeBrowserNotification} />}
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
      </Container>
    </Layout>
  )
}
