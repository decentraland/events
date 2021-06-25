
import React, { useMemo, useEffect } from "react"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby-plugin-intl"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Field } from "decentraland-ui/dist/components/Field/Field"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import useFeatureSupported from "decentraland-gatsby/dist/hooks/useFeatureSupported"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"

import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import * as segment from '../modules/segment'
import useAnalytics from "../hooks/useAnalytics"
import { ProfileSettingsAttributes } from "../entities/ProfileSettings/types"

import Section from "../components/Text/Section"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { toBase64 } from "decentraland-gatsby/dist/utils/string/base64"
import usePushSubscription from "../hooks/usePushSubscription"
import API from "decentraland-gatsby/dist/utils/api/API"
import isEmail from "validator/lib/isEmail"
import track from "decentraland-gatsby/dist/utils/segment/segment"
import Time from "decentraland-gatsby/dist/utils/date/Time"

import useCountdown from "decentraland-gatsby/dist/hooks/useCountdown"
import './settings.css'
import Navigation from "../components/Layout/Navigation"

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
  const l = useFormatMessage()
  const siteStore = useSiteStore(props.location)
  const isNotificationSupported = useFeatureSupported("Notification")
  const isServiceWorkerSupported = useFeatureSupported("ServiceWorker")
  const isPushSupported = useFeatureSupported("PushManager")
  const isPushNotificationSupported = isNotificationSupported && isServiceWorkerSupported && isPushSupported
  const [subscription, subscribe, unsubscribe] = usePushSubscription()
  const [state, patchState] = usePatchState<SettingsPageState>({ updating: {}, settings: { ...siteStore.settings } })
  const currentEmail = state.settings.email || ''
  const currentEmailChanged = currentEmail !== (siteStore.settings?.email || '')
  const currentEmailIsValid = isEmail(currentEmail)
  const settings: Partial<ProfileSettingsAttributes> = siteStore.settings || {}
  const emailNextVerificationDate = useMemo(() => {
    return settings.email_updated_at ?
      new Date(settings.email_updated_at.getTime() + Time.Minute):
      new Date()
  }, [settings.email_updated_at?.getTime()])
  const emailVerificationCountdown = useCountdown(emailNextVerificationDate)
  const emailVerificationAvailable = useMemo(() => {
    if (
      settings.email &&
      !settings.email_verified &&
      emailVerificationCountdown.time === 0
    ) {
      return true
    }

    return false
  }, [settings.email, settings.email_verified, emailVerificationCountdown.time])

  const emailMessageField = useMemo(() => {
    if (!settings.email || settings.email_verified) {
      return ""
    }

    if (emailVerificationCountdown.time === 0) {
      return l(`settings.profile_section.email_reverifying_message`) || ''
    }

    const seconds = emailVerificationCountdown.minutes * 60 + emailVerificationCountdown.seconds
    return l(`settings.profile_section.email_verifying_message`, { seconds }) || ''
  }, [settings.email, settings.email_verified, emailVerificationCountdown.time])

  useEffect(() => {
    if (siteStore.settings) {
      patchState({ settings: { ...siteStore.settings } })
    }
  }, [siteStore.settings])

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
      .updateSettings({ email: currentEmail, email_verified: false })
      .then(() => patchState({ updating: { ...state.updating, email: false } }))
  }

  function handleChangeUseLocalTime() {
    patchState({ updating: { ...state.updating, useLocalTime: true } })
    siteStore
      .updateSettings({ use_local_time: !state.settings.use_local_time })
      .then((settings) => settings && track((analytics) => analytics.track(segment.SegmentEvent.Settings, settings)))
      .then(() => patchState({ updating: { ...state.updating, useLocalTime: false } }))
  }

  function handleChangeEmailNotification() {
    if (!state.settings.email_verified) {
      return
    }

    patchState({ updating: { ...state.updating, emailNotification: true } })
    siteStore
      .updateSettings({ notify_by_email: !state.settings.notify_by_email })
      .then((settings) => settings && track((analytics) => analytics.track(segment.SegmentEvent.Settings, settings)))
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

  return (<>
      <Navigation />
      <Container className="SettingsPage">
        {siteStore.loading && <div>
          <Divider />
          <Loader active size="massive" style={{ position: 'relative' }} />
          <Divider />
        </div>}
        {!siteStore.loading && !siteStore.profile && <div style={{ textAlign: 'center' }}>
          <Divider />
          <Paragraph secondary>
            {l(`sign_in.message`, {
              action: <Link onClick={() => null}>
                {l(`general.sign_in`)}
              </Link>
            })}
          </Paragraph>
          <Divider />
        </div>}
        {!siteStore.loading && siteStore.profile && <Grid style={{ paddingTop: '4rem' }}>
          <Grid.Row>
            <Grid.Column tablet="4">
              <Section uppercase>
                {l(`settings.profile_section.label`)}
              </Section>
            </Grid.Column>
            <Grid.Column tablet="8">
              <Paragraph small secondary style={{ margin: 0 }}>
                {l(`settings.profile_section.email_title`)}
              </Paragraph>
              <Paragraph small semiBold>
                {l(`settings.profile_section.email_description`)}
              </Paragraph>
              <div className="AddonField">
                <Field label="Email address" placeholder="example@domain.com" message={emailMessageField} value={currentEmail} onChange={handleChangeEmail} />
                {currentEmailChanged && <Button basic loading={state.updating.email} disabled={!currentEmailIsValid} onClick={handleSaveEmail}>
                  {l(`settings.profile_section.email_save_action`)}
                </Button>}
                {(
                  !currentEmailChanged &&
                  siteStore.settings &&
                  siteStore.settings.email &&
                  siteStore.settings.email_verified
                  ) && <Button basic>
                  {l(`settings.profile_section.email_verified`)} <img src={check} width={18} height={18} />
                </Button>}
                {(
                  !currentEmailChanged &&
                  siteStore.settings &&
                  siteStore.settings.email &&
                  !siteStore.settings.email_verified &&
                  emailVerificationAvailable
                  ) && <Button basic loading={state.updating.email} onClick={handleSaveEmail}>
                  {l(`settings.profile_section.email_reverifying`)}
                </Button>}
                {(
                  !currentEmailChanged &&
                  siteStore.settings &&
                  siteStore.settings.email &&
                  !siteStore.settings.email_verified &&
                  !emailVerificationAvailable
                  ) && <Button basic disabled>
                  {l(`settings.profile_section.email_verifying`)}
                </Button>}
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
        {!siteStore.loading && siteStore.profile && <Grid style={{ paddingTop: '4rem' }}>
          <Grid.Row>
            <Grid.Column tablet="4">
              <Section uppercase>{l(`settings.event_section.label`)}</Section>
            </Grid.Column>
            <Grid.Column tablet="8">
              <Paragraph small secondary>
                {l(`settings.event_section.timezone_title`)}
              </Paragraph>
              <div className="SettingsSection">
                <div className="SettingsDetails">
                  <Paragraph small semiBold>
                    {l(`settings.event_section.timezone_description`)}
                  </Paragraph>
                  <Paragraph tiny secondary>
                    {l(`settings.event_section.timezone_message`)}
                  </Paragraph>
                </div>
                <div className="SettingsToggle">
                  {state.updating.useLocalTime && <Loader size="mini" active />}
                  {!state.updating.useLocalTime && <Radio toggle checked={!state.settings.use_local_time} onClick={handleChangeUseLocalTime} />}
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
        {!siteStore.loading && siteStore.profile && <Grid style={{ paddingTop: '4rem' }}>
          <Grid.Row>
            <Grid.Column tablet="4">
            </Grid.Column>
            <Grid.Column tablet="8">
              <Paragraph small secondary>
                {l(`settings.event_section.notification_title`)}
              </Paragraph>
            </Grid.Column>
            <Grid.Column tablet="4"></Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column tablet="4">
            </Grid.Column>
            <Grid.Column tablet="8">
              <div className="SettingsSection">
                <div className={TokenList.join(["SettingsDetails", !state.settings.email_verified && 'SettingsDetails--disabled'])}>
                  <Paragraph small semiBold>
                    {l(`settings.event_section.notification_by_email_description`)}
                  </Paragraph>
                  <Paragraph primary tiny>
                    {l(`settings.event_section.notification_by_email_message`)}
                  </Paragraph>
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
                <div className={TokenList.join(["SettingsDetails", !isPushNotificationSupported && 'SettingsDetails--disabled'])}>
                  <Paragraph small semiBold>
                    {l(`settings.event_section.notification_by_browser_description`)}
                  </Paragraph>
                  <Paragraph tiny secondary>
                    {l(`settings.event_section.notification_by_browser_message`)}
                  </Paragraph>
                </div>
                <div className="SettingsToggle">
                  {state.updating.webNotification && <Loader size="mini" active />}
                  {!state.updating.webNotification && <Radio toggle disabled={!isPushNotificationSupported} checked={!!subscription} onClick={handleChangeBrowserNotification} />}
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
      </Container>
    </>)
}
