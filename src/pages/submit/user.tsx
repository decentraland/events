import React, { useCallback, useMemo, useState } from "react"

import { useLocation } from "@gatsbyjs/reach-router"
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Avatar from "decentraland-gatsby/dist/components/User/Avatar"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import { Blockie } from "decentraland-ui/dist/components/Blockie/Blockie"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Header } from "decentraland-ui/dist/components/Header/Header"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"
import Input from "semantic-ui-react/dist/commonjs/elements/Input"
import isEthereumAddress from "validator/lib/isEthereumAddress"

import Events from "../../api/Events"
import Navigation from "../../components/Layout/Navigation"
import { useProfileSettingsContext } from "../../context/ProfileSetting"
import {
  ProfilePermissions,
  updateProfileSettingsSchema,
} from "../../entities/ProfileSettings/types"
import { canEditAnyProfile } from "../../entities/ProfileSettings/utils"
import locations from "../../modules/locations"

const availablePermissions =
  updateProfileSettingsSchema.properties.permissions.items.enum

export default function SettingsPage() {
  const l = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [settings, settingsState] = useProfileSettingsContext()
  const [value, setValue] = useState("")
  const handleChangeValue = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.currentTarget.value),
    [setValue]
  )
  const actionProps = useMemo(
    () => ({
      content: "Load user",
      color: "primary",
      disabled: !isEthereumAddress(value),
      onClick: () => {
        if (isEthereumAddress(value)) {
          navigate(locations.editUser(value.toLowerCase()))
        }
      },
    }),
    [value]
  )
  const location = useLocation()
  const user = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const user = params.get("user")
    if (user && isEthereumAddress(user)) {
      return user.toLowerCase()
    }

    return null
  }, [location.search])

  const [profile, profileState] = useAsyncMemo(
    async () => (user ? Events.get().getProfileSetting(user!) : null),
    [account, user],
    { callWithTruthyDeps: true }
  )

  const profilePermissions = useMemo(
    () => new Set(profile?.permissions || []),
    [profile]
  )

  const [avatar] = useAsyncMemo(
    async () => user && Catalyst.get().getProfile(user!),
    [user]
  )

  const [updating, update] = useAsyncTask(
    async (permission: ProfilePermissions) => {
      if (!user) {
        return
      }
      if (!canEditAnyProfile(settings)) {
        return
      }
      const permissions = new Set(profilePermissions)
      if (permissions.has(permission)) {
        permissions.delete(permission)
      } else {
        permissions.add(permission)
      }

      const newProfile = await Events.get().updateProfileSetting(user, {
        permissions: Array.from(permissions),
      })

      profileState.set(newProfile)
    },
    [user, profile, profileState, profilePermissions]
  )

  if (
    !account ||
    accountState.loading ||
    settingsState.loading ||
    profileState.loading
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

  if (!canEditAnyProfile(settings)) {
    return (
      <>
        <Navigation action={false} />
        <Container style={{ paddingTop: "75px" }}>
          <NotFound />
        </Container>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Navigation action={false} />
        <Container className="permissions-page">
          <Grid stackable style={{ paddingTop: "4rem" }}>
            <Grid.Row>
              <Grid.Column tablet="4" />
              <Grid.Column tablet="8">
                <Paragraph></Paragraph>
                <Input
                  style={{ width: "100%" }}
                  placeholder="0x0000000000000000000000000000000000000000"
                  action={actionProps}
                  size="small"
                  onChange={handleChangeValue}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </>
    )
  }

  return (
    <>
      <Navigation action={false} />
      <Container className="permissions-page" style={{ paddingTop: "4rem" }}>
        <Grid stackable>
          <Grid.Row>
            <Grid.Column tablet="4">
              <Header sub>{l(`page.users.section_label_profile`)}</Header>
            </Grid.Column>
            <Grid.Column tablet="1" style={{ paddingRight: 0 }}>
              {user && !avatar && <Blockie seed={user} scale={10} />}
              {user && avatar && <Avatar address={user} size="big" />}
            </Grid.Column>
            <Grid.Column tablet="7" verticalAlign="middle">
              {user && !avatar && <Paragraph>{user}</Paragraph>}
              {user && avatar && (
                <Paragraph secondary tiny style={{ margin: 0 }}>
                  {user}
                </Paragraph>
              )}
              {user && avatar && (
                <Paragraph style={{ lineHeight: "1em" }}>
                  {avatar.name}
                </Paragraph>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Grid stackable style={{ paddingTop: "4rem" }}>
          {availablePermissions.map((permission, i) => {
            return (
              <Grid.Row key={permission}>
                <Grid.Column tablet="4">
                  {i === 0 && (
                    <Header sub>
                      {l(`page.users.section_label_permissions`)}
                    </Header>
                  )}
                </Grid.Column>
                <Grid.Column tablet="7">
                  <Paragraph
                    small
                    semiBold
                    style={{ margin: "0 0 .4em 0", lineHeight: "1em" }}
                  >
                    {l(`page.users.permissions.${permission}.name`)}
                  </Paragraph>
                  <Paragraph
                    tiny
                    secondary
                    style={{ margin: "0 0 .4em 0", lineHeight: "1em" }}
                  >
                    {l(`page.users.permissions.${permission}.description`)}
                  </Paragraph>
                </Grid.Column>
                <Grid.Column tablet="1" verticalAlign="middle">
                  <Loader active={updating} size="tiny" />
                  <Radio
                    toggle
                    checked={profilePermissions.has(permission)}
                    disabled={!canEditAnyProfile(settings) || updating}
                    onClick={() => update(permission)}
                  />
                </Grid.Column>
              </Grid.Row>
            )
          })}
        </Grid>
      </Container>
    </>
  )
}
