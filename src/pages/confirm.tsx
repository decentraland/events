import React from "react"
import { useLocation } from "@gatsbyjs/reach-router"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import {
  ProfileSettingsAttributes,
  EmailSubscriptionStatus,
} from "../entities/ProfileSettings/types"

import "./settings.css"
import Navigation from "../components/Layout/Navigation"

export type SettingsPageState = {
  updating: Partial<{
    webNotification: boolean
    emailNotification: boolean
    useLocalTime: boolean
    email: boolean
  }>
  settings: Partial<ProfileSettingsAttributes>
}

export default function SettingsPage(props: any) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const unsubscribe = params.get("unsubscribe")
  const verify = params.get("verify")
  const ok = String(EmailSubscriptionStatus.OK)
  const expired = String(EmailSubscriptionStatus.Expired)
  const invalid = String(EmailSubscriptionStatus.Invalid)

  return (
    <>
      <Navigation />
      <Container className="SettingsPage">
        {verify === ok && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>Your email was verified</Paragraph>
            <Divider />
          </div>
        )}
        {unsubscribe === ok && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>Your subscription was canceled</Paragraph>
            <Divider />
          </div>
        )}
        {(verify === expired || unsubscribe === expired) && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>Invalid token</Paragraph>
            <Divider />
          </div>
        )}
        {(verify === invalid || unsubscribe === invalid) && (
          <div style={{ textAlign: "center" }}>
            <Divider />
            <Paragraph secondary>This link expired</Paragraph>
            <Divider />
          </div>
        )}
      </Container>
    </>
  )
}
