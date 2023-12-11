import React, { useCallback, useMemo, useState } from "react"

import MaintenancePage from "decentraland-gatsby/dist/components/Layout/MaintenancePage"
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Avatar from "decentraland-gatsby/dist/components/User/Avatar"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import { Address } from "decentraland-ui/dist/components/Address/Address"
import { Blockie } from "decentraland-ui/dist/components/Blockie/Blockie"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import { Table } from "decentraland-ui/dist/components/Table/Table"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import Input from "semantic-ui-react/dist/commonjs/elements/Input"

import Events from "../api/Events"
import Navigation, {
  NavigationAction,
  NavigationTab,
} from "../components/Layout/Navigation"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import {
  ProfileSettingsAttributes,
  updateProfileSettingsSchema,
} from "../entities/ProfileSettings/types"
import { canEditAnyProfile } from "../entities/ProfileSettings/utils"
import { Flags } from "../modules/features"
import locations from "../modules/locations"

import "./users.css"

const availablePermissions =
  updateProfileSettingsSchema.properties.permissions.items.enum

export default function SettingsPage() {
  const l = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [settings, settingsState] = useProfileSettingsContext()
  const [ff] = useFeatureFlagContext()
  const [filter, setFilter] = useState("")
  const handleChangeFilter = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFilter(e.currentTarget.value),
    [setFilter]
  )
  const [profiles, profilesState] = useAsyncMemo(
    () => Events.get().getProfileSettings(),
    [account],
    {
      callWithTruthyDeps: true,
      initialValue: [] as ProfileSettingsAttributes[],
    }
  )
  const filteredProfiles = useMemo(
    () =>
      (profiles || []).filter((profile) =>
        profile.user.toLowerCase().includes(filter.toLowerCase())
      ),
    [profiles, filter]
  )

  const [avatars] = useAsyncMemo(
    async () =>
      Catalyst.getInstance().getProfiles(
        profiles.map((profile) => profile.user)
      ),
    [profiles]
  )

  const avatarsMap = useMemo(
    () =>
      new Map(
        (avatars || [])
          .filter(Boolean)
          .map(
            (profile) => [profile!.ethAddress.toLowerCase(), profile] as const
          )
      ),
    [avatars]
  )

  if (ff.flags[Flags.Maintenance]) {
    return <MaintenancePage />
  }

  if (
    !account ||
    accountState.loading ||
    settingsState.loading ||
    profilesState.loading
  ) {
    return (
      <>
        <Navigation />
        <Container>
          <SignIn
            isConnecting={accountState.loading || settingsState.loading}
            onConnect={() => accountState.select()}
          />
        </Container>
      </>
    )
  }

  if (!canEditAnyProfile(settings)) {
    return (
      <>
        <Navigation />
        <NotFound />
      </>
    )
  }

  return (
    <>
      <Navigation
        action={NavigationAction.SubmitUser}
        activeTab={NavigationTab.Users}
      />
      <Container className="users-page" style={{ paddingTop: "2rem" }}>
        <Grid>
          <Grid.Row>
            <Grid.Column mobile="6">
              <Input
                style={{ width: "100%" }}
                icon
                iconPosition="left"
                size="small"
              >
                <Icon name="search" />
                <input
                  placeholder="0x0000000000000000000000000000000000000000"
                  onChange={handleChangeFilter}
                />
              </Input>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        {filteredProfiles.length === 0 && (
          <div>
            <Divider />
            <Paragraph secondary style={{ textAlign: "center" }}>
              {l("page.users.not_found")}
            </Paragraph>
            <Divider />
          </div>
        )}
        {filteredProfiles.length > 0 && (
          <Table padded>
            <Table.Body>
              {filteredProfiles.map((profile) => {
                const currentPermissions = new Set(profile.permissions)
                const avatar = avatarsMap.get(profile.user)
                return (
                  <Table.Row key={profile.user}>
                    <Table.Cell className="avatar-cell">
                      {!avatar && (
                        <Blockie scale={3} seed={profile.user}>
                          <Address value={profile.user} />
                        </Blockie>
                      )}
                      {avatar && (
                        <Paragraph small>
                          <Avatar address={profile.user} size="tiny" />{" "}
                          {avatar.name}
                        </Paragraph>
                      )}
                    </Table.Cell>
                    {availablePermissions.map((permission) => {
                      const hasPermission = currentPermissions.has(permission)
                      return (
                        <Table.Cell
                          key={permission}
                          disabled={!hasPermission}
                          center
                        >
                          <Paragraph secondary={!hasPermission} tiny>
                            <Icon
                              color={hasPermission ? "green" : "red"}
                              name={hasPermission ? "checkmark" : "close"}
                            />
                            {l(`page.users.permissions.${permission}.name`)}
                          </Paragraph>
                        </Table.Cell>
                      )
                    })}
                    <Table.Cell>
                      <Button
                        basic
                        as={Link}
                        href={locations.editUser(profile.user)}
                      >
                        EDIT
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
