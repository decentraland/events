import React, { useCallback, useMemo, useState } from "react"

import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Avatar from "decentraland-gatsby/dist/components/User/Avatar"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Header } from "decentraland-ui/dist/components/Header/Header"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import { Table } from "decentraland-ui/dist/components/Table/Table"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"

import Events from "../api/Events"
import Navigation, { NavigationAction } from "../components/Layout/Navigation"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import { canEditAnySchedule } from "../entities/ProfileSettings/utils"
import { ScheduleAttributes } from "../entities/Schedule/types"
import { getScheduleBackground } from "../entities/Schedule/utils"
import { showTimezoneLabel } from "../modules/date"
import locations from "../modules/locations"

import "./users.css"

export default function SettingsPage() {
  const l = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [settings, settingsState] = useProfileSettingsContext()
  const [schedules, schedulesState] = useAsyncMemo(
    async () => {
      const schedules = await Events.get().getSchedules()
      return schedules.sort((a, b) => {
        return (
          Time.date(a.active_since).getTime() -
          Time.date(b.active_since).getTime()
        )
      })
    },
    [account],
    {
      callWithTruthyDeps: true,
      initialValue: [] as ScheduleAttributes[],
    }
  )

  if (
    !account ||
    accountState.loading ||
    settingsState.loading ||
    schedulesState.loading
  ) {
    return (
      <>
        <Navigation action={false} />
        <Container>
          <SignIn
            isConnecting={accountState.loading || settingsState.loading}
            onConnect={() => accountState.select()}
          />
        </Container>
      </>
    )
  }

  if (!canEditAnySchedule(settings)) {
    return (
      <>
        <Navigation action={false} />
        <NotFound />
      </>
    )
  }

  return (
    <>
      <Navigation action={NavigationAction.SubmitSchedule} />
      <Container className="SchedulesPage" style={{ paddingTop: "2rem" }}>
        {schedules.length === 0 && (
          <div>
            <Divider />
            <Paragraph secondary style={{ textAlign: "center" }}>
              {l("page.schedules.not_found")}
            </Paragraph>
            <Divider />
          </div>
        )}
        {schedules.length > 0 && (
          <Table padded>
            <Table.Header>
              <Table.HeaderCell style={{ padding: 0 }}></Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell>{l("page.schedules.name")}</Table.HeaderCell>
              <Table.HeaderCell textAlign="center">
                {l("page.schedules.active_since")}
                <Icon name="arrow right" style={{ margin: "0 1rem" }} />
                {l("page.schedules.active_until")}
              </Table.HeaderCell>
              <Table.HeaderCell textAlign="center">
                {l("page.schedules.active")}
              </Table.HeaderCell>
              <Table.HeaderCell textAlign="right">
                {l("page.schedules.actions")}
              </Table.HeaderCell>
            </Table.Header>
            <Table.Body>
              {schedules.map((schedule) => {
                return (
                  <Table.Row key={schedule.id}>
                    <Table.Cell
                      style={{
                        background: getScheduleBackground(schedule),
                        padding: 0,
                        width: "10px",
                      }}
                    />
                    <Table.Cell
                      style={{
                        backgroundImage: `url('${schedule.image}')`,
                        backgroundSize: "cover",
                        width: "125px",
                      }}
                    />
                    <Table.Cell className="avatar-cell">
                      <Paragraph small>{schedule.name}</Paragraph>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Paragraph tiny>
                        {Time.from(schedule.active_since, {
                          utc: !settings.use_local_time,
                        }).format("YYYY/MM/DD HH:mm")}{" "}
                        <span style={{ opacity: 0.5 }}>
                          {showTimezoneLabel(
                            schedule.active_since,
                            settings.use_local_time
                          )}
                        </span>
                        <Icon name="arrow right" style={{ margin: "0 1rem" }} />
                        {Time.from(schedule.active_until, {
                          utc: !settings.use_local_time,
                        }).format("YYYY/MM/DD HH:mm")}{" "}
                        <span style={{ opacity: 0.5 }}>
                          {showTimezoneLabel(
                            schedule.active_until,
                            settings.use_local_time
                          )}
                        </span>
                      </Paragraph>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Header sub>
                        {schedule.active
                          ? l("page.schedules.active_true")
                          : l("page.schedules.active_false")}
                      </Header>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Button
                        basic
                        as={Link}
                        href={locations.editSchedule(schedule.id)}
                      >
                        {l("page.schedules.edit")}
                      </Button>
                      <Button
                        basic
                        as={Link}
                        href={locations.schedule(schedule.id)}
                      >
                        {l("page.schedules.open")}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Container>
    </>
  )
}
