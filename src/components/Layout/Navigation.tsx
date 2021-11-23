import React, { useMemo } from "react"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import SubmitButton from "../Button/SubmitButton"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import locations from "../../modules/locations"
import { useEventsContext } from "../../context/Event"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import "./Navigation.css"

export enum NavigationTab {
  Events = "events",
  MyEvents = "my_events",
  PendingEvents = "pending_events",
}

export type NavigationProps = {
  activeTab?: NavigationTab
}

export default function Navigation(props: NavigationProps) {
  const l = useFormatMessage()
  const [events] = useEventsContext()
  const [account] = useAuthContext()
  const hasPendingEvents = useMemo(
    () => events.some((event) => !event.approved && !event.rejected),
    [events]
  )

  return (
    <Tabs>
      <Link href={locations.events()}>
        <Tabs.Tab active={props.activeTab === NavigationTab.Events}>
          {l("navigation.events")}
        </Tabs.Tab>
      </Link>
      {account && (
        <Link href={locations.myEvents()}>
          <Tabs.Tab active={props.activeTab === NavigationTab.MyEvents}>
            {l("navigation.my_events")}
          </Tabs.Tab>
        </Link>
      )}
      {hasPendingEvents && (
        <Link href={locations.pendingEvents()}>
          <Tabs.Tab active={props.activeTab === NavigationTab.PendingEvents}>
            {l("navigation.pending_events")}
          </Tabs.Tab>
        </Link>
      )}
      <SubmitButton as={Link} href={locations.submit()} />
    </Tabs>
  )
}
