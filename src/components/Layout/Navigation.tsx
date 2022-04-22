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
import track from "decentraland-gatsby/dist/utils/development/segment"
import { SegmentEvent } from "../../modules/segment"
import debounce from "decentraland-gatsby/dist/utils/function/debounce"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"

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
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const [events] = useEventsContext()
  const [account] = useAuthContext()
  const hasPendingEvents = useMemo(
    () => events.some((event) => !event.approved && !event.rejected),
    [events]
  )
  const [ff] = useFeatureFlagContext()

  const trackFunction = useCallback(
    debounce((search: string) => {
      track((analytics) =>
        analytics.track(SegmentEvent.Filter, {
          ethAddress: account,
          featureFlag: ff.flags,
          search: search,
        })
      )
    }, 500),
    [account, ff.flags]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newParams = new URLSearchParams(params)
      if (e.target.value) {
        newParams.set("search", e.target.value)
        trackFunction(e.target.value)
      } else {
        newParams.delete("search")
      }

      let target = location.pathname
      const search = newParams.toString()
      if (search) {
        target += "?" + search
      }

      navigate(target)
    },
    [location.pathname, params, trackFunction]
  )

  return (
    <>
      <Tabs>
        <div className={"tabs__wrapper"}>
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
              <Tabs.Tab
                active={props.activeTab === NavigationTab.PendingEvents}
              >
                {l("navigation.pending_events")}
              </Tabs.Tab>
            </Link>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div className={"tabs__wrapper"}>
          {props.search && (
            <SearchInput
              placeholder={l("navigation.search")}
              onChange={handleSearchChange}
              defaultValue={params.get("search") || ""}
            />
          )}
          <SubmitButton as={Link} href={locations.submit()} />
        </div>
      </Tabs>
    </>
  )
}
