import React from "react"

import { useLocation } from "@gatsbyjs/reach-router"
import MaintenancePage from "decentraland-gatsby/dist/components/Layout/MaintenancePage"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import Navigation from "../components/Layout/Navigation"
import {
  EmailSubscriptionStatus,
  ProfileSettingsAttributes,
} from "../entities/ProfileSettings/types"
import { Flags } from "../modules/features"

import "./settings.css"

export type SettingsPageState = {
  updating: Partial<{
    webNotification: boolean
    emailNotification: boolean
    useLocalTime: boolean
    email: boolean
  }>
  settings: Partial<ProfileSettingsAttributes>
}

export default function SettingsPage() {
  const location = useLocation()
  const l = useFormatMessage()
  const [ff] = useFeatureFlagContext()
  const params = new URLSearchParams(location.search)
  const unsubscribe = params.get("unsubscribe")
  const verify = params.get("verify")
  const ok = String(EmailSubscriptionStatus.OK)
  const expired = String(EmailSubscriptionStatus.Expired)
  const invalid = String(EmailSubscriptionStatus.Invalid)

  if (ff.flags[Flags.Maintenance]) {
    return <MaintenancePage />
  }

  return (
    <>
      <Navigation />
      <Container className="SettingsPage">
        {verify === ok && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>{l("page.confirm.email_verified")}</Paragraph>
            <Divider />
          </div>
        )}
        {unsubscribe === ok && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>
              {l("page.confirm.subscription_canceled")}
            </Paragraph>
            <Divider />
          </div>
        )}
        {(verify === expired || unsubscribe === expired) && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>{l("page.confirm.invalid_token")}</Paragraph>
            <Divider />
          </div>
        )}
        {(verify === invalid || unsubscribe === invalid) && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>{l("page.confirm.link_expired")}</Paragraph>
            <Divider />
          </div>
        )}
      </Container>
    </>
  )
}
