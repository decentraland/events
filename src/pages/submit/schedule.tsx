import React, { useEffect, useMemo, useRef } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Field } from "decentraland-ui/dist/components/Field/Field"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import Header from "semantic-ui-react/dist/commonjs/elements/Header"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import SelectionLabel from "semantic-ui-react/dist/commonjs/elements/Label"

import Events, { EditSchedule } from "../../api/Events"
import AddCoverButton from "../../components/Button/AddCoverButton"
import ImageInput from "../../components/Form/ImageInput"
import Label from "../../components/Form/Label"
import Textarea from "../../components/Form/Textarea"
import ItemLayout from "../../components/Layout/ItemLayout"
import {
  POSTER_FILE_SIZE,
  POSTER_FILE_TYPES,
} from "../../entities/Poster/types"
import { getScheduleBackground } from "../../entities/Schedule/utils"
import useScheduleEditor, {
  useScheduleEditorId,
} from "../../hooks/useScheduleEditor"
import locations from "../../modules/locations"

import "./schedule.css"

type ScheduleEditPageState = {
  loading?: boolean
  uploadingPoster?: boolean
  requireWallet?: boolean
  requireConfirmation?: boolean
  previewingDescription?: boolean
  errorImageSize?: boolean
  errorImageFormat?: boolean
  errorImageServer?: string | null
  error?: string | null
}

export default function ScheduleEditPage() {
  const l = useFormatMessage()
  const [state, patchState] = usePatchState<ScheduleEditPageState>({})
  const [account, accountState] = useAuthContext()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const [editing, editActions] = useScheduleEditor()
  const [original] = useScheduleEditorId(params.get("schedule"))

  const backgroundRef = useRef(new Array(0))

  useEffect(() => {
    if (original) {
      editActions.setValues({
        name: original.name,
        description: original.description,
        background: original.background,
        image: original.image,
        active_since: original.active_since,
        active_until: original.active_until,
      })
    }
  }, [original])

  const [uploadingPoster, uploadPoster] = useAsyncTask(
    async (file: File) => {
      if (!POSTER_FILE_TYPES.includes(file.type)) {
        patchState({
          errorImageSize: false,
          errorImageFormat: true,
          errorImageServer: null,
        })
      } else if (POSTER_FILE_SIZE < file.size) {
        patchState({
          errorImageSize: true,
          errorImageFormat: false,
          errorImageServer: null,
        })
      } else {
        patchState({
          errorImageSize: false,
          errorImageFormat: false,
          errorImageServer: null,
        })
        try {
          const poster = await Events.get().uploadPoster(file)
          editActions.setValue("image", poster.url)
        } catch (err) {
          patchState({ errorImageServer: (err as any).message })
        }
      }
    },
    [state]
  )

  const styleBackground = useMemo(
    () => ({ background: getScheduleBackground(editing) }),
    [editing.background]
  )

  const loading = accountState.loading
  const errors = editing.errors
  const coverError =
    state.errorImageSize || state.errorImageFormat || !!state.errorImageServer

  function getAppropriateBlackWhiteFontColor(hex: string) {
    if (hex.indexOf("#") === 0) {
      hex = hex.slice(1)
    }
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length !== 6) {
      return "#000000"
    }
    const r: number = parseInt(hex.slice(0, 2), 16)
    const g: number = parseInt(hex.slice(2, 4), 16)
    const b: number = parseInt(hex.slice(4, 6), 16)

    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#FFFFFF"
  }

  const [submitting, submit] = useAsyncTask(async () => {
    try {
      if (!editActions.validate()) {
        return null
      }

      const data = editActions.toObject()

      await (original
        ? Events.get().updateSchedule(original.id, data as EditSchedule)
        : Events.get().createSchedule(data as EditSchedule))

      navigate(locations.events(), { replace: true })
    } catch (err) {
      patchState({
        loading: false,
        error: (err as any).body?.error || (err as any).message,
      })
    }
  }, [editActions])

  return (
    <>
      <Helmet>
        <title>{l("social.schedule_edit.title") || ""}</title>
      </Helmet>
      <Container style={{ paddingTop: "75px" }}>
        {loading && (
          <Grid stackable>
            <Grid.Row centered>
              <Grid.Column
                mobile="16"
                textAlign="center"
                style={{ paddingTop: "30vh", paddingBottom: "30vh" }}
              >
                <Loader size="big" />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        )}
        {!loading && (!account || accountState.loading) && (
          <SignIn
            isConnecting={accountState.loading}
            onConnect={() => accountState.select()}
          />
        )}
        {!loading && account && (
          <ItemLayout>
            <Title style={{ fontSize: "34px", lineHeight: "42px" }}>
              {l("page.schedule_edit.title")}
            </Title>
            <Grid stackable>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <ImageInput
                    label={l("page.schedule_edit.schedule_cover_label")}
                    value={editing.image || ""}
                    onFileChange={uploadPoster}
                    loading={uploadingPoster}
                    error={coverError}
                    message={
                      (state.errorImageSize && (
                        <>
                          {l("page.schedule_edit.error_image_size")}{" "}
                          <a
                            href="https://imagecompressor.com/"
                            target="_blank"
                          >
                            <strong>{l("page.submit.optimizilla")}</strong>
                          </a>
                        </>
                      )) ||
                      (state.errorImageFormat && (
                        <>
                          {l("page.submit.error_image_format")}{" "}
                          <strong>jpg</strong>, <strong>png</strong> or{" "}
                          <strong>gif</strong>
                        </>
                      )) ||
                      state.errorImageServer ||
                      l("page.submit.image_recommended_size")
                    }
                  >
                    <div className="ImageInput__Description">
                      <AddCoverButton />
                      <Paragraph>
                        <span className="ImageInput__Description__Primary">
                          {l("page.submit.browse")}
                        </span>{" "}
                        {l("page.submit.browse_line1_label")}
                        <br />
                        {l("page.submit.browse_line2_label")}
                        <br />
                        <i style={{ opacity: 0.8 }}>
                          {l("page.submit.image_recommended_size")}
                        </i>
                      </Paragraph>
                    </div>
                  </ImageInput>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Header sub>
                    {l("page.schedule_edit.background_label")}
                  </Header>

                  <div
                    className="schedule-edit__background-gradient-preview"
                    style={styleBackground}
                  ></div>

                  <div className="schedule-edit__background-selected-wrapper">
                    {editing.background.map((color, index) => (
                      <SelectionLabel
                        key={index}
                        className={
                          "schedule-edit__background-selected-label-wrapper"
                        }
                        style={{
                          background: color,
                          color: getAppropriateBlackWhiteFontColor(color),
                          position: "relative",
                        }}
                        onClick={() => {
                          if (backgroundRef && backgroundRef.current) {
                            backgroundRef.current[index].click()
                          }
                        }}
                      >
                        {l("page.schedule_edit.background_selected_label", {
                          color: color,
                        })}
                        <Icon
                          className={"schedule-edit__background-selected-label"}
                          name="delete"
                          circular
                          onClick={(event: React.ChangeEvent<any>) => {
                            event.stopPropagation()
                            editActions.handleChange(event, {
                              name: "background_remove",
                              value: index,
                            })
                          }}
                        />
                        <input
                          type="color"
                          style={{
                            opacity: 0,
                            position: "absolute",
                            left: 0,
                            bottom: 0,
                          }}
                          ref={(el) => {
                            backgroundRef.current[index] = el
                          }}
                          onChange={(event: any) => {
                            editActions.handleChange(event, {
                              name: "background",
                              value: {
                                color: event.currentTarget.value,
                                position: index,
                              },
                            })
                          }}
                        ></input>
                      </SelectionLabel>
                    ))}
                    <Button
                      basic
                      small
                      className="schedule-edit__background-selected-button"
                      onClick={(event) => {
                        editActions.handleChange(event, {
                          name: "background",
                          value: {
                            color: getScheduleBackground({ background: [] }),
                          },
                        })
                      }}
                    >
                      {l("page.schedule_edit.background_add_button")}
                    </Button>
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Field
                    label={l("page.schedule_edit.name_label")}
                    placeholder={l("page.schedule_edit.name_placeholder")}
                    style={{ width: "100%" }}
                    name="name"
                    error={!!errors["name"]}
                    message={errors["name"]}
                    value={editing.name}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Textarea
                    minHeight={72}
                    maxHeight={500}
                    label={l("page.schedule_edit.description_label")}
                    placeholder={l(
                      "page.schedule_edit.description_placeholder"
                    )}
                    name="description"
                    error={!!errors["description"]}
                    message={errors["description"]}
                    value={editing.description}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="8">
                  <Field
                    label={l("page.schedule_edit.active_since_date_label")}
                    name="active_since_date"
                    type="date"
                    error={
                      !!errors["active_since"] || !!errors["active_since_date"]
                    }
                    message={errors["active_since_date"]}
                    value={editActions.getActiveSinceDate()}
                    min={Time.from(Date.now())
                      .startOf("day")
                      .format(Time.Formats.InputDate)}
                    max={Time.from(Date.now())
                      .startOf("day")
                      .format(Time.Formats.InputDate)}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                <Grid.Column mobile="6">
                  <Field
                    label={l("page.schedule_edit.active_since_time_label")}
                    name="active_since_time"
                    type="time"
                    error={
                      !!errors["active_since_at"] ||
                      !!errors["active_since_time"]
                    }
                    message={errors["active_since_time"]}
                    value={editActions.getActiveSinceTime()}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                <Grid.Column mobile="2">
                  <Paragraph className="FieldNote">
                    {l("general.utc")}
                  </Paragraph>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="8">
                  <Field
                    label={l("page.schedule_edit.active_until_date_label")}
                    name="active_until_date"
                    type="date"
                    error={
                      !!errors["active_until"] || !!errors["active_until_date"]
                    }
                    message={errors["active_until_date"]}
                    value={editActions.getActiveUntilDate()}
                    min={Time.from(Date.now())
                      .startOf("day")
                      .format(Time.Formats.InputDate)}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                <Grid.Column mobile="6">
                  <Field
                    label={l("page.schedule_edit.active_until_time_label")}
                    name="active_until_time"
                    type="time"
                    error={
                      !!errors["active_until_at"] ||
                      !!errors["active_until_time"]
                    }
                    message={errors["active_until_time"]}
                    value={editActions.getActiveUntilTime()}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                <Grid.Column mobile="2">
                  <Paragraph className="FieldNote">
                    {l("general.utc")}
                  </Paragraph>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="6">
                  <Button
                    primary
                    loading={submitting}
                    disabled={submitting}
                    style={{ width: "100%" }}
                    onClick={submit}
                  >
                    {l("page.submit.submit")}
                  </Button>
                </Grid.Column>
              </Grid.Row>
              {state.error && (
                <Grid.Row>
                  <Grid.Column mobile="16">
                    <Paragraph style={{ color: "#ff0000" }}>
                      {state.error}
                    </Paragraph>
                  </Grid.Column>
                </Grid.Row>
              )}
            </Grid>
          </ItemLayout>
        )}
      </Container>
    </>
  )
}
