import React, { useMemo, useState } from "react"

import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import { Table } from "decentraland-ui/dist/components/Table/Table"
import { Blockie } from "decentraland-ui/dist/components/Blockie/Blockie"
import { Address } from "decentraland-ui/dist/components/Address/Address"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Avatar from "decentraland-gatsby/dist/components/User/Avatar"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"

import check from "../images/check.svg"
import Navigation from "../components/Layout/Navigation"
import { useProfileSettingsContext } from "../context/ProfileSetting"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import { canEditAnyProfile } from "../entities/ProfileSettings/utils"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import Events from "../api/Events"
import {
  ProfileSettingsAttributes,
  updateProfileSettingsSchema,
} from "../entities/ProfileSettings/types"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import "./users.css"

const availablePermissions =
  updateProfileSettingsSchema.properties.permissions.items.enum

export default function SettingsPage() {
  const l = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [settings, settingsState] = useProfileSettingsContext()
  const [users] = useAsyncMemo(
    () => Events.get().getProfileSettings(),
    [account],
    {
      callWithTruthyDeps: true,
      initialValue: [] as ProfileSettingsAttributes[],
    }
  )

  const currentUserPermissions = useMemo(
    () => new Set(settings.permissions),
    [settings.permissions]
  )
  const [avatars] = useAsyncMemo(
    async () =>
      Catalyst.get().getProfiles(users.map((profile) => profile.user)),
    [users]
  )

  const avatarsMap = useMemo(
    () =>
      new Map(
        (avatars || []).map(
          (profile) => [profile!.ethAddress.toLowerCase(), profile] as const
        )
      ),
    [avatars]
  )

  if (!account || accountState.loading || settingsState.loading) {
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
      <Navigation />
      <Container className="UsersPage" style={{ paddingTop: "4rem" }}>
        <Table padded>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>User</Table.HeaderCell>
              {availablePermissions.map((permission) => {
                return (
                  <Table.HeaderCell
                    key={permission}
                    disabled={!currentUserPermissions.has(permission)}
                  >
                    {l("page.users.permissions." + permission)}
                  </Table.HeaderCell>
                )
              })}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((profile) => {
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
                        <Avatar address={profile.user} size="small" />{" "}
                        {avatar.name}
                      </Paragraph>
                    )}
                  </Table.Cell>
                  {availablePermissions.map((permission) => {
                    return (
                      <Table.Cell
                        key={permission}
                        disabled={!currentUserPermissions.has(permission)}
                      >
                        {currentPermissions.has(permission) && (
                          <Icon color="green" name="checkmark" size="large" />
                        )}
                      </Table.Cell>
                    )
                  })}
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </Container>
    </>
  )
}
