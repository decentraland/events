import React, { useEffect, useMemo, useState } from "react"

import { Helmet } from "react-helmet"

import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useCountdown from "decentraland-gatsby/dist/hooks/useCountdown"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Field } from "decentraland-ui/dist/components/Field/Field"
import { Header } from "decentraland-ui/dist/components/Header/Header"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"
import isEmail from "validator/lib/isEmail"

import Navigation from "../components/Layout/Navigation"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import check from "../images/check.svg"

import "./settings.css"

export default function SettingsPage() {
  const l = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [settings, state] = useProfileSettingsContext()
  const [email, setEmail] = useState(settings.email)
  const currentEmailChanged = email !== settings.email
  const currentEmailIsValid = useMemo(() => isEmail(email || ""), [email])
  useEffect(() => setEmail(settings.email), [settings.email])

  // const emailNextVerificationDate = useMemo(() => {
  //   return settings.email_updated_at
  //     ? new Date(settings.email_updated_at.getTime() + Time.Minute)
  //     : new Date()
  // }, [settings.email_updated_at?.getTime()])

  // const emailVerificationCountdown = useCountdown(emailNextVerificationDate)
  // const emailVerificationAvailable = useMemo(() => {
  //   if (
  //     settings &&
  //     settings.email &&
  //     !settings.email_verified &&
  //     emailVerificationCountdown.time === 0
  //   ) {
  //     return true
  //   }

  //   return false
  // }, [settings.email, settings.email_verified, emailVerificationCountdown.time])

  // const emailMessageField = useMemo(() => {
  //   if (!settings.email || settings.email_verified) {
  //     return ""
  //   }

  //   if (emailVerificationCountdown.time === 0) {
  //     return l(`settings.profile_section.email_reverifying_message`) || ""
  //   }

  //   const seconds =
  //     emailVerificationCountdown.minutes * 60 +
  //     emailVerificationCountdown.seconds
  //   return (
  //     l(`settings.profile_section.email_verifying_message`, { seconds }) || ""
  //   )
  // }, [settings.email, settings.email_verified, emailVerificationCountdown.time])

  // function handleSaveEmail() {
  //   if (!currentEmailIsValid) {
  //     return
  //   }

  //   state.update({ email })
  // }

  if (!account || accountState.loading) {
    return (
      <>
        <Helmet>
          <title>{l("social.home.title") || ""}</title>
          <meta
            name="description"
            content={l("social.home.description") || ""}
          />

          <meta property="og:title" content={l("social.home.title") || ""} />
          <meta
            property="og:description"
            content={l("social.home.description") || ""}
          />
          <meta property="og:image" content={l("social.home.image") || ""} />
          <meta property="og:site" content={l("social.home.site") || ""} />

          <meta name="twitter:title" content={l("social.home.title") || ""} />
          <meta
            name="twitter:description"
            content={l("social.home.description") || ""}
          />
          <meta name="twitter:image" content={l("social.home.image") || ""} />
          <meta name="twitter:card" content={l("social.home.card") || ""} />
          <meta
            name="twitter:creator"
            content={l("social.home.creator") || ""}
          />
          <meta name="twitter:site" content={l("social.home.site") || ""} />
        </Helmet>
        <Navigation action={false} />
        <Container>
          <SignIn
            isConnecting={accountState.loading}
            onConnect={() => accountState.select()}
          />
        </Container>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{l("social.home.title") || ""}</title>
        <meta name="description" content={l("social.home.description") || ""} />

        <meta property="og:title" content={l("social.home.title") || ""} />
        <meta
          property="og:description"
          content={l("social.home.description") || ""}
        />
        <meta property="og:image" content={l("social.home.image") || ""} />
        <meta property="og:site" content={l("social.home.site") || ""} />

        <meta name="twitter:title" content={l("social.home.title") || ""} />
        <meta
          name="twitter:description"
          content={l("social.home.description") || ""}
        />
        <meta name="twitter:image" content={l("social.home.image") || ""} />
        <meta name="twitter:card" content={l("social.home.card") || ""} />
        <meta name="twitter:creator" content={l("social.home.creator") || ""} />
        <meta name="twitter:site" content={l("social.home.site") || ""} />
      </Helmet>
      <Navigation action={false} />
      <Container className="SettingsPage">
        <Grid style={{ paddingTop: "4rem" }}>
          <Grid.Row>
            <Grid.Column tablet="4">
              <Header sub>{l(`settings.event_section.timezone_title`)}</Header>
            </Grid.Column>
            <Grid.Column tablet="8">
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
                  <Loader size="mini" active={state?.loading} />
                  <Radio
                    toggle
                    checked={!settings.use_local_time}
                    disabled={state?.loading}
                    onClick={prevent(() =>
                      state.update({
                        use_local_time: !settings.use_local_time,
                      })
                    )}
                  />
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </>
  )
}
