import React, { useCallback, useMemo } from "react"
import { navigate } from "gatsby"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import SubmitButton from "../Button/SubmitButton"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import locations from "../../modules/locations"
import { useEventsContext } from "../../context/Event"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import SearchInput from "../Form/SearchInput"
import { useLocation } from "@gatsbyjs/reach-router"
import "./Navigation.css"

export enum NavigationTab {
  Events = "events",
  MyEvents = "my_events",
  PendingEvents = "pending_events",
}

export type NavigationProps = {
  activeTab?: NavigationTab
  search?: boolean
}

export default function Navigation(props: NavigationProps) {
  const l = useFormatMessage()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [ location.search ])
  const [events] = useEventsContext()
  const [account] = useAuthContext()
  const hasPendingEvents = useMemo(
    () => events.some((event) => !event.approved && !event.rejected),
    [events]
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(params)
    if (e.target.value) {
      newParams.set('search', e.target.value)
    } else {
      newParams.delete('search')
    }

    let target = location.pathname
    const search = newParams.toString()
    if (search) {
      target += '?' + search
    }

    navigate(target)
  }, [ location.pathname, params ])

  return (
    <>
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
        <Link href={locations.events()}>
          <Tabs.Tab>
           History
          </Tabs.Tab>
        </Link>
        <div style={{ flex: 1 }} />
        {props.search && <SearchInput placeholder={l('navigation.search')} onChange={handleSearchChange} defaultValue={params.get('search') || ''} />}
        <SubmitButton as={Link} href={locations.submit()} />
      </Tabs>
    </>
  )
}
