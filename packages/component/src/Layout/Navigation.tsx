import React, { useCallback, useMemo } from "react"

import { useLocation } from "@gatsbyjs/reach-router"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Link, navigate } from "decentraland-gatsby/dist/plugins/intl"
import debounce from "decentraland-gatsby/dist/utils/function/debounce"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import { ScheduleTheme } from "events-type/src/types/Schedule"
import { useEventsContext } from "events-web/src/context/Event"
import { getCurrentSchedules } from "events-web/src/entities/Schedule/utils"
import { getSchedules } from "events-web/src/modules/events"
import locations from "events-web/src/modules/locations"
import { SegmentEvent } from "events-web/src/modules/segment"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"

import SearchInput from "../Form/SearchInput"
import { Rabbit } from "../Icon/Rabbit"

import "./Navigation.css"

export enum NavigationTab {
  Events = "events",
  MyEvents = "my_events",
  PendingEvents = "pending_events",
  Schedule = "schedule",
}

export enum NavigationAction {
  SubmitEvent = "event",
  SubmitUser = "user",
  SubmitSchedule = "schedule",
}

export type NavigationProps = {
  activeTab?: NavigationTab
  action?: NavigationAction | false | null
  search?: boolean
}

export default function Navigation(props: NavigationProps) {
  const l = useFormatMessage()
  const location = useLocation()
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )
  const action = useMemo(() => {
    switch (props.action) {
      case false:
      case null:
        return false
      case NavigationAction.SubmitSchedule:
        return NavigationAction.SubmitSchedule
      case NavigationAction.SubmitUser:
        return NavigationAction.SubmitUser
      default:
        return NavigationAction.SubmitEvent
    }
  }, [props.action])
  const [events] = useEventsContext()
  const [account] = useAuthContext()
  const [schedules] = useAsyncMemo(getSchedules)
  const currentSchedule = useMemo(
    () => getCurrentSchedules(schedules),
    [schedules]
  )

  const hasPendingEvents = useMemo(
    () => events.some((event) => !event.approved && !event.rejected),
    [events]
  )

  const track = useTrackContext()
  const debounceTrack = useCallback(
    debounce(
      (search: string) => track(SegmentEvent.Filter, { search: search }),
      500
    ),
    [track]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newParams = new URLSearchParams(params)
      if (e.target.value) {
        newParams.set("search", e.target.value)
      } else {
        newParams.delete("search")
      }

      debounceTrack(e.target.value)
      let target = location.pathname
      const search = newParams.toString()
      if (search) {
        target += "?" + search
      }

      navigate(target)
    },
    [location.pathname, params, debounceTrack]
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
          {hasPendingEvents && (
            <Link href={locations.pendingEvents()}>
              <Tabs.Tab
                active={props.activeTab === NavigationTab.PendingEvents}
              >
                {l("navigation.pending_events")}
              </Tabs.Tab>
            </Link>
          )}
          {currentSchedule && (
            <Link href={locations.schedule(currentSchedule.id)}>
              <Tabs.Tab active={props.activeTab === NavigationTab.Schedule}>
                {currentSchedule.theme ===
                  ScheduleTheme.MetaverseFestival2022 && <Rabbit />}
                {currentSchedule.name}
              </Tabs.Tab>
            </Link>
          )}
          {account && (
            <Link href={locations.myEvents()}>
              <Tabs.Tab active={props.activeTab === NavigationTab.MyEvents}>
                {l("navigation.my_events")}
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
          {action === NavigationAction.SubmitEvent && (
            <Button
              primary
              size="small"
              as={Link}
              href={locations.submitEvent()}
            >
              <Icon name="plus" /> {l("navigation.submit_events")}
            </Button>
          )}
          {action === NavigationAction.SubmitUser && (
            <Button
              primary
              size="small"
              as={Link}
              href={locations.submitUser()}
            >
              <Icon name="add user" /> {l("navigation.submit_users")}
            </Button>
          )}
          {action === NavigationAction.SubmitSchedule && (
            <Button
              primary
              size="small"
              as={Link}
              href={locations.submitSchedule()}
            >
              <Icon name="calendar plus" /> {l("navigation.submit_schedules")}
            </Button>
          )}
        </div>
      </Tabs>
    </>
  )
}
