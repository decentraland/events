import React, { useEffect, useMemo } from "react"
import { useLocation } from "@gatsbyjs/reach-router"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import SelectionLabel from "semantic-ui-react/dist/commonjs/elements/Label"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import { Field } from "decentraland-ui/dist/components/Field/Field"
import { SelectField } from "decentraland-ui/dist/components/SelectField/SelectField"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFileDrop from "decentraland-gatsby/dist/hooks/useFileDrop"
import Markdown from "decentraland-gatsby/dist/components/Text/Markdown"
import Bold from "decentraland-gatsby/dist/components/Text/Bold"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import useEventEditor from "../hooks/useEventEditor"
import AddCoverButton from "../components/Button/AddCoverButton"
import ConfirmModal from "../components/Modal/ConfirmModal"
import ImageInput from "../components/Form/ImageInput"
import Textarea from "../components/Form/Textarea"
import Label from "../components/Form/Label"
import RadioGroup from "../components/Form/RadioGroup"
import Events, { EditEvent } from "../api/Events"
import { POSTER_FILE_SIZE, POSTER_FILE_TYPES } from "../entities/Poster/types"
import {
  Frequency,
  WeekdayMask,
  Position,
  MAX_EVENT_RECURRENT,
} from "../entities/Event/types"
import {
  isLatestRecurrentSetpos,
  toRecurrentSetposName,
  toRRuleDates,
} from "../entities/Event/utils"
import { useEventIdContext, useEventsContext } from "../context/Event"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import locations from "../modules/locations"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import Helmet from "react-helmet"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import ItemLayout from "../components/Layout/ItemLayout"
import { getServerOptions, getServers } from "../modules/servers"
import infoIcon from "../images/info.svg"
import "./submit.css"
import { getCategoriesFetch, getCategoriesOptionsActives } from "../modules/events"

type SubmitPageState = {
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

const options = { utc: true }
const recurrentOptions = [
  { value: false, text: "Does not repeat" },
  { value: true, text: "Repeat every" },
]

const recurrentFrequencyOptions = [
  { value: Frequency.DAILY, text: "days" },
  { value: Frequency.WEEKLY, text: "weeks" },
  { value: Frequency.MONTHLY, text: "month" },
]

const recurrentEndsOptions = [
  { value: "count", text: "After" },
  { value: "until", text: "On" },
]

export default function SubmitPage() {
  const l = useFormatMessage()
  const location = useLocation()
  const [state, patchState] = usePatchState<SubmitPageState>({})
  const [account, accountState] = useAuthContext()
  const [servers] = useAsyncMemo(getServers)
  const [categories] = useAsyncMemo(getCategoriesFetch)
  const [editing, editActions] = useEventEditor()
  const params = new URLSearchParams(location.search)
  const [, eventsState] = useEventsContext()
  const [original, eventState] = useEventIdContext(params.get("event"))
  const serverOptions = useMemo(
    () => getServerOptions(servers || []),
    [servers]
  )
  
  const categoryOptions = useMemo(
    () => {
      const categoriesOptions = getCategoriesOptionsActives(
        categories,
        editing.categories
      )
      return categoriesOptions.map((categoryOption) => ({ ...categoryOption, text: l(categoryOption.text)}))
    },
    [categories, editing.categories]
  )
  
  const loading = accountState.loading && eventState.loading

  const recurrent_date = useMemo(
    () => toRRuleDates(editing, (_, i) => i < MAX_EVENT_RECURRENT),
    [
      editing.start_at,
      editing.recurrent,
      editing.recurrent_count,
      editing.recurrent_until,
      editing.recurrent_frequency,
      editing.recurrent_interval,
      editing.recurrent_month_mask,
      editing.recurrent_weekday_mask,
      editing.recurrent_setpos,
      editing.recurrent_monthday,
    ]
  )

  // useEffect(() => { GLOBAL_LOADING = false }, [])

  useEffect(() => {
    if (original) {
      editActions.setValues({
        name: original.name,
        image: original.image,
        description: original.description,
        x: original.x,
        y: original.y,
        server: original.server,
        start_at: original.start_at,
        duration: original.duration,
        all_day: original.all_day,
        url: original.url,
        highlighted: original.highlighted,
        trending: original.trending,
        rejected: original.rejected,
        approved: original.approved,
        contact: original.contact,
        details: original.details,
        recurrent: original.recurrent,
        recurrent_count: original.recurrent_count,
        recurrent_until: original.recurrent_until,
        recurrent_frequency: original.recurrent_frequency,
        recurrent_interval: original.recurrent_interval,
        recurrent_month_mask: original.recurrent_month_mask,
        recurrent_weekday_mask: original.recurrent_weekday_mask,
        recurrent_setpos: original.recurrent_setpos,
        recurrent_monthday: original.recurrent_monthday,
        categories: original.categories,
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

  const [submitting, submit] = useAsyncTask(async () => {
    if (!editActions.validate()) {
      return null
    }

    try {
      const data = editActions.toObject()
      const submitted = await (original
        ? Events.get().updateEvent(original.id, data as EditEvent)
        : Events.get().createEvent(data as EditEvent))

      eventsState.add(submitted)
      navigate(locations.event(submitted.id))
    } catch (err) {
      patchState({
        loading: false,
        error: (err as any).body?.error || (err as any).message,
      })
    }
  }, [original])

  const [removing, remove] = useAsyncTask(async () => {
    if (original) {
      const event = await Events.get().updateEvent(original.id, {
        rejected: true,
        approved: false,
      })
      eventsState.add(event)
      navigate(locations.events())
    }
  }, [original])

  const [notifying, notify] = useAsyncTask(async () => {
    if (original) {
      await Events.get().notifyEvent(original.id)
    }
  }, [original])

  function handleReject() {
    if (original && (original.owned || original.editable)) {
      patchState({ requireConfirmation: true, error: null })
    }
  }

  useFileDrop((e) => {
    const files = e.dataTransfer?.files
    if (files && files[0]) {
      uploadPoster(files[0])
    }
  })

  const errors = editing.errors
  const coverError =
    state.errorImageSize || state.errorImageFormat || !!state.errorImageServer
  const now = Date.now()

  if (!account || accountState.loading) {
    return (
      <>
        <Helmet>
          <title>{l("social.submit.title") || ""}</title>
          <meta
            name="description"
            content={l("social.submit.description") || ""}
          />

          <meta property="og:title" content={l("social.submit.title") || ""} />
          <meta
            property="og:description"
            content={l("social.submit.description") || ""}
          />
          <meta property="og:image" content={l("social.submit.image") || ""} />
          <meta property="og:site" content={l("social.submit.site") || ""} />

          <meta name="twitter:title" content={l("social.submit.title") || ""} />
          <meta
            name="twitter:description"
            content={l("social.submit.description") || ""}
          />
          <meta name="twitter:image" content={l("social.submit.image") || ""} />
          <meta name="twitter:card" content={l("social.submit.card") || ""} />
          <meta
            name="twitter:creator"
            content={l("social.submit.creator") || ""}
          />
          <meta name="twitter:site" content={l("social.submit.site") || ""} />
        </Helmet>
        <Container style={{ paddingTop: "75px" }}>
          <SignIn
            isConnecting={accountState.loading}
            onConnect={() => accountState.select()}
          />
        </Container>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{l("social.submit.title") || ""}</title>
        <meta
          name="description"
          content={l("social.submit.description") || ""}
        />

        <meta property="og:title" content={l("social.submit.title") || ""} />
        <meta
          property="og:description"
          content={l("social.submit.description") || ""}
        />
        <meta property="og:image" content={l("social.submit.image") || ""} />
        <meta property="og:site" content={l("social.submit.site") || ""} />

        <meta name="twitter:title" content={l("social.submit.title") || ""} />
        <meta
          name="twitter:description"
          content={l("social.submit.description") || ""}
        />
        <meta name="twitter:image" content={l("social.submit.image") || ""} />
        <meta name="twitter:card" content={l("social.submit.card") || ""} />
        <meta
          name="twitter:creator"
          content={l("social.submit.creator") || ""}
        />
        <meta name="twitter:site" content={l("social.submit.site") || ""} />
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
        {!loading && !account && (
          <Grid stackable>
            <Grid.Row centered>
              <Grid.Column
                mobile="16"
                textAlign="center"
                style={{ paddingTop: "30vh", paddingBottom: "30vh" }}
              >
                <Paragraph secondary>
                  You need to <Link onClick={() => null}>sign in</Link> before
                  to submit an event
                </Paragraph>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        )}
        {!loading && account && (
          <ItemLayout>
            <Title style={{ fontSize: "34px", lineHeight: "42px" }}>
              Submit event
            </Title>
            <Paragraph secondary>
              Be sure to fill in as many details as possible to generate
              interest in your event.
            </Paragraph>
            <Grid stackable>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <ImageInput
                    label="Event Cover"
                    value={editing.image || ""}
                    onFileChange={uploadPoster}
                    loading={uploadingPoster}
                    error={coverError}
                    message={
                      (state.errorImageSize && (
                        <>
                          This image is too heavy (more than 500Kb), try with{" "}
                          <a
                            href="https://imagecompressor.com/"
                            target="_blank"
                          >
                            <strong>optimizilla</strong>
                          </a>
                        </>
                      )) ||
                      (state.errorImageFormat && (
                        <>
                          This file format is not supported, try with{" "}
                          <strong>jpg</strong>, <strong>png</strong> or{" "}
                          <strong>gif</strong>
                        </>
                      )) ||
                      state.errorImageServer ||
                      "(recommended size: 1340 x 670)"
                    }
                  >
                    <div className="ImageInput__Description">
                      <AddCoverButton />
                      <Paragraph>
                        <span className="ImageInput__Description__Primary">
                          Browse
                        </span>{" "}
                        your computer or <br />
                        drag a picture to add a cover <br />
                        <i style={{ opacity: 0.8 }}>
                          (recommended size: 1340 x 670)
                        </i>
                      </Paragraph>
                    </div>
                  </ImageInput>
                </Grid.Column>
              </Grid.Row>
              {!!original?.editable && (
                <Grid.Row>
                  <Grid.Column mobile="16">
                    <Label style={{ marginBottom: "1em" }}>Advance</Label>
                  </Grid.Column>
                  <Grid.Column mobile="4">
                    <Radio
                      name="highlighted"
                      label="HIGHLIGHT"
                      checked={editing.highlighted}
                      onClick={(e, data) =>
                        editActions.handleChange(e, {
                          ...data,
                          checked: !editing.highlighted,
                        })
                      }
                    />
                  </Grid.Column>
                  <Grid.Column mobile="4">
                    <Radio
                      name="trending"
                      label="TRENDING"
                      checked={editing.trending}
                      onClick={(e, data) =>
                        editActions.handleChange(e, {
                          ...data,
                          checked: !editing.trending,
                        })
                      }
                    />
                  </Grid.Column>
                </Grid.Row>
              )}
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Field
                    label="Event Name"
                    placeholder="Be as descriptive as you can"
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
                  <Radio
                    toggle
                    label="PREVIEW"
                    checked={state.previewingDescription}
                    onChange={(_, ctx) =>
                      patchState({ previewingDescription: ctx.checked })
                    }
                    style={{ position: "absolute", right: 0 }}
                  />
                  {!state.previewingDescription && (
                    <Textarea
                      minHeight={72}
                      maxHeight={500}
                      label="Description"
                      placeholder="Keep it short but keep it interesting!"
                      name="description"
                      error={!!errors["description"]}
                      message={errors["description"]}
                      value={editing.description}
                      onChange={editActions.handleChange}
                    />
                  )}
                  {state.previewingDescription && <Label>Description</Label>}
                  {state.previewingDescription && (
                    <div
                      style={{
                        minHeight: "72px",
                        paddingTop: "4px",
                        paddingBottom: "12px",
                      }}
                    >
                      <Markdown children={editing.description} />
                    </div>
                  )}
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Divider size="tiny" />
                </Grid.Column>
              </Grid.Row>
              {/* DEPRECATED // TODO: since max duration is 24hrs, this needs to be rebuild or erased
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Label style={{ cursor: "pointer" }}>
                    All day event ?
                    <Radio
                      toggle
                      name="all_day"
                      checked={editing.all_day}
                      onClick={(e, data) =>
                        editActions.handleChange(e, {
                          ...data,
                          checked: !editing.all_day,
                        })
                      }
                      style={{ marginLeft: "1em", verticalAlign: "bottom" }}
                    />
                  </Label>
                </Grid.Column>
                    </Grid.Row>*/}
              <Grid.Row>
                <Grid.Column mobile="8">
                  <Field
                    label="Start date"
                    name="start_date"
                    type="date"
                    error={!!errors["start_at"] || !!errors["start_date"]}
                    message={errors["finish_at"] || errors["start_date"]}
                    value={editActions.getStartDate()}
                    min={Time.from(Date.now())
                      .startOf("day")
                      .format(Time.Formats.InputDate)}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                {!editing.all_day && (
                  <Grid.Column mobile="6">
                    <Field
                      label="Start time"
                      name="start_time"
                      type="time"
                      error={!!errors["start_at"] || !!errors["start_time"]}
                      message={errors["start_time"]}
                      value={editActions.getStartTime()}
                      onChange={editActions.handleChange}
                    />
                  </Grid.Column>
                )}
                {!editing.all_day && (
                  <Grid.Column mobile="2">
                    <Paragraph className="FieldNote">UTC</Paragraph>
                  </Grid.Column>
                )}
                <Grid.Column mobile="8">
                  <Field
                    label="End date"
                    name="finish_date"
                    type="date"
                    error={!!errors["finish_at"] || !!errors["finish_date"]}
                    message={
                      errors["finish_at"] ||
                      errors["finish_date"] ||
                      "Maximum allowed duration " +
                        editActions.getMaxHoursAllowedLabel()
                    }
                    value={editActions.getFinishDate()}
                    min={editActions.getStartDate()}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                {!editing.all_day && (
                  <Grid.Column mobile="6">
                    <Field
                      label="End time"
                      name="finish_time"
                      type="time"
                      error={!!errors["finish_at"] || !!errors["finish_time"]}
                      message={errors["finish_time"]}
                      value={editActions.getFinishTime()}
                      onChange={editActions.handleChange}
                    />
                  </Grid.Column>
                )}
                {!editing.all_day && (
                  <Grid.Column mobile="2">
                    <Paragraph className="FieldNote">UTC</Paragraph>
                  </Grid.Column>
                )}
                <Grid.Column mobile="16">
                  <Divider size="mini" />
                </Grid.Column>
                <Grid.Column mobile="8">
                  <SelectField
                    label="Repeat"
                    search={false}
                    placeholder="Does not repeat"
                    name="recurrent"
                    error={!!errors["recurrent"]}
                    message={errors["recurrent"]}
                    options={recurrentOptions}
                    value={!!editing.recurrent}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                {editing.recurrent && (
                  <Grid.Column mobile="4">
                    <Field
                      label="&nbsp;"
                      type="number"
                      name="recurrent_interval"
                      error={!!errors["recurrent_interval"]}
                      message={errors["recurrent_interval"]}
                      value={editing.recurrent_interval}
                      onChange={editActions.handleChange}
                    />
                  </Grid.Column>
                )}
                {editing.recurrent && (
                  <Grid.Column mobile="4">
                    <SelectField
                      label="&nbsp;"
                      search={false}
                      name="recurrent_frequency"
                      error={!!errors["recurrent_frequency"]}
                      message={errors["recurrent_frequency"]}
                      options={recurrentFrequencyOptions}
                      value={editing.recurrent_frequency || Frequency.DAILY}
                      onChange={editActions.handleChange}
                    />
                  </Grid.Column>
                )}
                {editing.recurrent &&
                  editing.recurrent_frequency === Frequency.WEEKLY && (
                    <Grid.Column mobile="16">
                      <RadioGroup label="Repeat on">
                        <Radio
                          label="SUN"
                          name="recurrent_weekday_mask[SUNDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.SUNDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.SUNDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label="MON"
                          name="recurrent_weekday_mask[MONDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.MONDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.MONDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label="TUE"
                          name="recurrent_weekday_mask[TUESDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.TUESDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.TUESDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label="WED"
                          name="recurrent_weekday_mask[WEDNESDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.WEDNESDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.WEDNESDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label="THU"
                          name="recurrent_weekday_mask[THURSDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.THURSDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.THURSDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label="FRI"
                          name="recurrent_weekday_mask[FRIDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.FRIDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.FRIDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label="SAT"
                          name="recurrent_weekday_mask[SATURDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.SATURDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !Boolean(
                                (editing.recurrent_weekday_mask || 0) &
                                  WeekdayMask.SATURDAY
                              ),
                            })
                          }
                        />
                      </RadioGroup>
                    </Grid.Column>
                  )}
                {editing.recurrent &&
                  editing.recurrent_frequency === Frequency.MONTHLY && (
                    <Grid.Column mobile="16">
                      <RadioGroup label="Repeat on">
                        <div style={{ flex: "1 1 100%", marginBottom: ".7em" }}>
                          <Radio
                            label={`Monthly on day ${editing.start_at.getUTCDate()}`}
                            name="recurrent_monthday[current]"
                            checked={editing.recurrent_monthday !== null}
                            onClick={editActions.handleChange}
                          />
                        </div>
                        <div style={{ flex: "1 1 100%", marginBottom: ".7em" }}>
                          <Radio
                            label={`Monthly on the ${toRecurrentSetposName(
                              editing.start_at
                            )} ${Time.from(editing.start_at, options).format(
                              "dddd"
                            )}`}
                            name="recurrent_setpos[current]"
                            checked={
                              editing.recurrent_setpos !== null &&
                              editing.recurrent_setpos !== Position.LAST
                            }
                            onChange={editActions.handleChange}
                          />
                        </div>
                        {isLatestRecurrentSetpos(editing.start_at) && (
                          <div
                            style={{ flex: "1 1 100%", marginBottom: ".7em" }}
                          >
                            <Radio
                              label={`Monthly on the last ${Time.from(
                                editing.start_at,
                                options
                              ).format("dddd")}`}
                              name="recurrent_setpos[last]"
                              checked={
                                editing.recurrent_setpos === Position.LAST
                              }
                              onChange={editActions.handleChange}
                            />
                          </div>
                        )}
                      </RadioGroup>
                    </Grid.Column>
                  )}
                {editing.recurrent && (
                  <Grid.Column mobile="8">
                    <SelectField
                      label="Ends"
                      name="recurrent_end"
                      search={false}
                      error={!!errors["recurrent"]}
                      message={errors["recurrent"]}
                      value={
                        (editing.recurrent_count != null && "count") ||
                        (editing.recurrent_until !== null && "until") ||
                        undefined
                      }
                      options={recurrentEndsOptions}
                      onChange={editActions.handleChange}
                    />
                  </Grid.Column>
                )}
                {editing.recurrent && editing.recurrent_count !== null && (
                  <Grid.Column mobile="3">
                    <Field
                      label="&nbsp;"
                      name="recurrent_count"
                      type="number"
                      error={!!errors["recurrent_count"]}
                      message={errors["recurrent_count"]}
                      value={editing.recurrent_count}
                      onChange={editActions.handleChange}
                    />
                  </Grid.Column>
                )}
                {editing.recurrent && editing.recurrent_count !== null && (
                  <Grid.Column mobile="5">
                    <Paragraph className="FieldNote">Occurrences</Paragraph>
                  </Grid.Column>
                )}
                {editing.recurrent && editing.recurrent_until !== null && (
                  <Grid.Column mobile="8">
                    <Field
                      label="&nbsp;"
                      name="recurrent_until"
                      type="date"
                      value={Time.from(editing.recurrent_until, options).format(
                        Time.Formats.InputDate
                      )}
                      onChange={editActions.handleChange}
                      min={Time.from(Date.now()).format(Time.Formats.InputDate)}
                    />
                  </Grid.Column>
                )}
                {editing.recurrent && recurrent_date.length > 0 && (
                  <Grid.Column mobile="16">
                    <Label>Dates ({recurrent_date.length}): </Label>
                  </Grid.Column>
                )}
                {editing.recurrent &&
                  recurrent_date.length > 0 &&
                  recurrent_date.map((date) => {
                    const datetime = Time.from(date, options)
                    return (
                      <Grid.Column mobile="12" key={date.getTime()}>
                        <Paragraph
                          secondary={date.getTime() + editing.duration < now}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              minWidth: "8em",
                              textAlign: "right",
                              marginRight: ".5em",
                            }}
                          >
                            {datetime.format("dddd, ")}
                          </span>
                          <span
                            style={{ display: "inline-block", minWidth: "4em" }}
                          >
                            {datetime.format("DD MMMM ")}
                          </span>
                          {date.getUTCFullYear()}
                        </Paragraph>
                      </Grid.Column>
                    )
                  })}
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="8">
                  <Label>Tags</Label>
                  <Paragraph tiny secondary>
                    Want a new tag? Ask for it on the <span className={'submit__tag__dao'}>DAO</span>.
                  </Paragraph>
                  <SelectField
                    placeholder="Add tag"
                    name="categories"
                    error={!!errors["categories"]}
                    message={errors["categories"]}
                    options={categoryOptions}
                    onChange={editActions.handleChange}
                    value={''}
                  />
                  {
                    editing.categories.map((category, key) => 
                      <SelectionLabel key={key} className={'submit__category-select-wrapper'}>
                        {l(`page.events.categories.${category}`)}
                        <Icon 
                          className={'submit__tag-select-label'} 
                          name='delete' 
                          circular 
                          onClick={(event: React.ChangeEvent<any>) => editActions.handleChange(event, { name: 'categories', value: category})} 
                        />
                      </SelectionLabel>
                    )
                  }
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="16">
                  <Divider size="tiny" />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="4">
                  <Field
                    label="Latitude (X)"
                    type="number"
                    name="x"
                    min="-170"
                    max="170"
                    error={!!errors["x"]}
                    message={errors["x"]}
                    value={editing.x}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                <Grid.Column mobile="4">
                  <Field
                    label="Longitude (Y)"
                    type="number"
                    name="y"
                    min="-170"
                    max="170"
                    error={!!errors["y"]}
                    message={errors["y"]}
                    value={editing.y}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
                <Grid.Column mobile="8">
                  <SelectField
                    label="Server"
                    placeholder="any server"
                    name="server"
                    error={!!errors["server"]}
                    message={errors["server"]}
                    options={serverOptions}
                    value={editing.server || ""}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="16">
                  <Divider size="tiny" />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="16">
                  <Field
                    disabled={!original?.owned}
                    label="Email or Discord username"
                    placeholder="hello@decentraland.org"
                    name="contact"
                    error={!!errors["contact"]}
                    message={errors["contact"]}
                    value={editing.contact}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Textarea
                    disabled={!original?.owned}
                    minHeight={72}
                    maxHeight={500}
                    label="Additional info"
                    placeholder="Add any other useful details for our reviewers"
                    name="details"
                    error={!!errors["details"]}
                    message={errors["details"]}
                    value={editing.details}
                    onChange={editActions.handleChange}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="6">
                  <Button
                    primary
                    loading={submitting || removing || notifying}
                    disabled={
                      (!!original && !original.owned && !original.editable) ||
                      submitting ||
                      removing ||
                      notifying
                    }
                    style={{ width: "100%" }}
                    onClick={prevent(() => submit())}
                  >
                    {original ? "SAVE" : "SUBMIT"}
                  </Button>
                </Grid.Column>
                <Grid.Column mobile="5">
                  {!!original && (!!original.owned || !!original.editable) && (
                    <Button
                      basic
                      loading={submitting || removing || notifying}
                      disabled={submitting || removing || notifying}
                      style={{ width: "100%" }}
                      onClick={handleReject}
                    >
                      DELETE
                    </Button>
                  )}
                </Grid.Column>
                <Grid.Column mobile="5">
                  {!!original?.editable && (
                    <Button
                      basic
                      loading={submitting || removing || notifying}
                      disabled={submitting || removing || notifying}
                      style={{ width: "100%" }}
                      onClick={prevent(() => notify())}
                    >
                      NOTIFY ME
                    </Button>
                  )}
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
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Paragraph secondary tiny>
                    <img
                      src={infoIcon}
                      width="16"
                      height="16"
                      style={{ verticalAlign: "middle", marginRight: ".5rem" }}
                    />
                    The event submission will be reviewed by our team, you’ll be
                    notified by email
                  </Paragraph>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </ItemLayout>
        )}
      </Container>
      <ConfirmModal
        open={state.requireConfirmation}
        onClose={() => patchState({ requireConfirmation: false })}
      >
        <Title>Are you absolutely sure?</Title>
        <Paragraph>
          This action <Bold>cannot</Bold> be undone. This will permanently
          delete the <Bold>{original?.name || "this"}</Bold> event
        </Paragraph>
        {state.error && <Paragraph primary>{state.error}</Paragraph>}
        <Button
          primary
          onClick={prevent(() => remove())}
          loading={submitting || removing}
          style={{ marginTop: "28px" }}
        >
          YES, DELETE THIS EVENT
        </Button>
      </ConfirmModal>
    </>
  )
}
