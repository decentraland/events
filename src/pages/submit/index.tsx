import React, { useCallback, useEffect, useMemo } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Markdown from "decentraland-gatsby/dist/components/Text/Markdown"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import useFileDrop from "decentraland-gatsby/dist/hooks/useFileDrop"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { Field } from "decentraland-ui/dist/components/Field/Field"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import { SelectField } from "decentraland-ui/dist/components/SelectField/SelectField"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import { TextAreaField } from "decentraland-ui/dist/components/TextAreaField/TextAreaField"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import SelectionLabel from "semantic-ui-react/dist/commonjs/elements/Label"

import Events, { EditEvent } from "../../api/Events"
import AddCoverButton from "../../components/Button/AddCoverButton"
import ImageInput from "../../components/Form/ImageInput"
import Label from "../../components/Form/Label"
import RadioGroup from "../../components/Form/RadioGroup"
import Info from "../../components/Info/Info"
import ItemLayout from "../../components/Layout/ItemLayout"
import ConfirmModal from "../../components/Modal/ConfirmModal"
import { useCategoriesContext } from "../../context/Category"
import { useEventIdContext, useEventsContext } from "../../context/Event"
import { useProfileSettingsContext } from "../../context/ProfileSetting"
import {
  Frequency,
  MAX_EVENT_RECURRENT,
  Position,
  WeekdayMask,
  eventLocations,
} from "../../entities/Event/types"
import {
  isLatestRecurrentSetpos,
  toRRuleDates,
  toRecurrentSetposName,
} from "../../entities/Event/utils"
import {
  POSTER_FILE_SIZE,
  POSTER_FILE_TYPES,
} from "../../entities/Poster/types"
import {
  canApproveAnyEvent,
  canEditAnyEvent,
  canTestAnyNotification,
} from "../../entities/ProfileSettings/utils"
import useEventEditor from "../../hooks/useEventEditor"
import WorldIcon from "../../images/worlds-icon.svg"
import { getSchedules, getSchedulesOptions } from "../../modules/events"
import { Flags } from "../../modules/features"
import locations from "../../modules/locations"
import { getServerOptions, getServers } from "../../modules/servers"
import { getWorldNames, getWorldNamesOptions } from "../../modules/worlds"

import "./index.css"

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

// TODO: work with timezones to show into the UI and storing it
/* type Options = {
  key: string
  text: string
  value: string
}
const allTimezones = Intl.supportedValuesOf("timeZone")

const offsetOptions = [
  ...(allTimezones
    .map((timezoneName) => {
      if (Time.tz(Date.now(), timezoneName).utcOffset() < 0) {
        return null
      }
      const offset = Time.tz(Date.now(), timezoneName).format("ZZ")
      const text = timezoneName.replace(/_/g, " ")

      return {
        key: timezoneName,
        text: `(GMT${offset}) ${text}`,
        value: timezoneName,
      }
    })
    .filter((option) => !!option)
    .sort((a, b) => {
      const offsetA = b!.text.replace("(GMT", "").split(") ")
      const offsetB = a!.text.replace("(GMT", "").split(") ")
      if (offsetA[0] === offsetB[0]) {
        return offsetA[1].localeCompare(offsetB[1])
      }
      return b!.text.localeCompare(a!.text)
    }) as Options[]),
  {
    key: "UTC",
    text: "UTC",
    value: "UTC",
  },
  ...(allTimezones
    .map((timezoneName) => {
      if (Time.tz(Date.now(), timezoneName).utcOffset() >= 0) {
        return null
      }
      const offset = Time.tz(Date.now(), timezoneName).format("ZZ")
      const text = timezoneName.replace(/_/g, " ")

      return {
        key: timezoneName,
        text: `(GMT${offset}) ${text}`,
        value: timezoneName,
      }
    })
    .filter((option) => !!option)
    .sort((a, b) => {
      const offsetA = b!.text.replace("(GMT", "").split(") ")
      const offsetB = a!.text.replace("(GMT", "").split(") ")
      if (offsetA[0] === offsetB[0]) {
        return offsetA[1].localeCompare(offsetB[1])
      }
      return a!.text.localeCompare(b!.text)
    }) as Options[]),
] */

const options = { utc: true }

const locationOptions = [
  {
    key: eventLocations.LAND,
    text: eventLocations.LAND,
    value: eventLocations.LAND,
  },
  {
    key: eventLocations.WORLD,
    text: eventLocations.WORLD,
    value: eventLocations.WORLD,
    image: { src: WorldIcon },
  },
]

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
  const [worlds] = useAsyncMemo(getWorldNames)
  const [categories] = useCategoriesContext()
  const [schedules] = useAsyncMemo(getSchedules)

  const [editing, editActions] = useEventEditor()
  const params = new URLSearchParams(location.search)
  const [, eventsState] = useEventsContext()
  const [settings] = useProfileSettingsContext()
  const [original, eventState] = useEventIdContext(params.get("event"))
  const [ff] = useFeatureFlagContext()

  const serverOptions = useMemo(() => {
    if (editing.world) {
      return getWorldNamesOptions(worlds)
    } else {
      return getServerOptions(servers)
    }
  }, [editing, servers, worlds])

  const scheduleOptions = useMemo(
    () => getSchedulesOptions(schedules, { exclude: editing.schedules }),
    [schedules, editing.schedules]
  )

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      key: category.name,
      value: category.name,
      text: l(`categories.${category.name}`),
    }))
  }, [categories])

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

  const isNewEvent = useMemo(
    () => !params.get("view") || params.get("view") === "clone",
    [params.get("view")]
  )

  const submitButtonLabel = useMemo(() => {
    if (original && params.get("view") === "edit") {
      return l("page.submit.save")
    } else if (original && params.get("view") === "clone") {
      return l("page.submit.clone")
    } else {
      return l("page.submit.submit")
    }
  }, [params.get("view"), original])

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
        schedules: original.schedules,
        world: original.world,
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
    if (!editActions.validate({ new: isNewEvent })) {
      return null
    }

    try {
      const data = editActions.toObject()

      const submitted = await (original && !isNewEvent
        ? Events.get().updateEvent(original.id, data as EditEvent)
        : Events.get().createEvent(data as EditEvent))

      eventsState.add(submitted)
      navigate(locations.event(submitted.id), { replace: true })
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

  const handleReject = useCallback(
    function () {
      if (
        original &&
        (original.user === settings.user || canApproveAnyEvent(settings))
      ) {
        patchState({ requireConfirmation: true, error: null })
      }
    },
    [original, patchState, settings]
  )

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
                  {l("sign_in.message", {
                    action: (
                      <Link onClick={() => null}>{l("general.sign_in")}</Link>
                    ),
                  })}
                </Paragraph>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        )}
        {!loading && account && (
          <ItemLayout>
            <Title style={{ fontSize: "34px", lineHeight: "42px" }}>
              {l("page.submit.submit_event")}
            </Title>
            <Paragraph secondary>
              {l("page.submit.be_sure_to_fill", {
                event: (
                  <Link href={l("page.submit.events_faq_url")}>
                    {l("page.submit.event")}
                  </Link>
                ),
              })}
            </Paragraph>
            <Grid stackable>
              <Grid.Row>
                <Grid.Column mobile="16">
                  <ImageInput
                    label={l("page.submit.event_cover")}
                    value={editing.image || ""}
                    onFileChange={uploadPoster}
                    loading={uploadingPoster}
                    error={coverError}
                    message={
                      (state.errorImageSize && (
                        <>
                          {l("page.submit.error_image_size")}{" "}
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
                      state.errorImageServer || (
                        <Info text={l("page.submit.image_recommended_label")} />
                      )
                    }
                  >
                    <div className="image-input__description">
                      <AddCoverButton />
                      <Paragraph>
                        <span className="image-input__description-primary">
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
              {canEditAnyEvent(settings) && !isNewEvent && (
                <Grid.Row className="admin-area">
                  <Grid.Column mobile="16">
                    <Grid stackable>
                      <Grid.Row>
                        <Grid.Column mobile="16">
                          <Label
                            style={{
                              marginBottom: "1rem",
                              display: "block",
                              opacity: 0.6,
                            }}
                          >
                            {l("page.submit.advance_label")}
                          </Label>
                        </Grid.Column>
                        <Grid.Column mobile="4">
                          <Radio
                            name="highlighted"
                            label={l("page.submit.highlight_label")}
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
                            label={l("page.submit.trending_label")}
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
                      <Grid.Row>
                        <Grid.Column mobile="16">
                          <Label>{l("page.submit.schedule_label")}</Label>
                          <SelectField
                            placeholder={l("page.submit.schedule_placeholder")}
                            name="schedules"
                            error={!!errors["schedules"]}
                            message={errors["schedules"]}
                            options={scheduleOptions}
                            onChange={editActions.handleChange}
                            value={""}
                            disabled={scheduleOptions.length === 0}
                            border
                          />
                          {editing.schedules.map((schedule) => {
                            const data = schedules?.find(
                              (current) => current.id === schedule
                            )
                            return (
                              <SelectionLabel
                                key={schedule}
                                className={"submit__category-select-wrapper"}
                              >
                                {data?.name || schedule}
                                <Icon
                                  className={"submit__category-select-label"}
                                  name="delete"
                                  circular
                                  onClick={(event: React.ChangeEvent<any>) =>
                                    editActions.handleChange(event, {
                                      name: "schedules",
                                      value: schedule,
                                    })
                                  }
                                />
                              </SelectionLabel>
                            )
                          })}
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Grid.Column>
                </Grid.Row>
              )}
              <Grid.Row>
                <Grid.Column mobile="16">
                  <Field
                    label={l("page.submit.event_name_label")}
                    placeholder={l("page.submit.event_name_placeholder")}
                    style={{ width: "100%" }}
                    name="name"
                    error={!!errors["name"]}
                    message={errors["name"]}
                    value={editing.name}
                    onChange={editActions.handleChange}
                    kind="full"
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16" className="submit__row-description">
                  <Radio
                    toggle
                    label={l("page.submit.preview_label")}
                    checked={state.previewingDescription}
                    onChange={(_, ctx) =>
                      patchState({ previewingDescription: ctx.checked })
                    }
                    style={{ position: "absolute", right: 0 }}
                  />
                  {!state.previewingDescription && (
                    <TextAreaField
                      label={l("page.submit.description_label")}
                      placeholder={l("page.submit.description_placeholder")}
                      name="description"
                      error={errors["description"]}
                      value={editing.description}
                      onChange={editActions.handleChange}
                    />
                  )}
                  {state.previewingDescription && (
                    <Label>{l("page.submit.description_label")}</Label>
                  )}
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
              <Grid.Row>
                <Grid.Column mobile="8">
                  <Field
                    label={l("page.submit.start_date_label")}
                    name="start_date"
                    type="date"
                    error={!!errors["start_at"] || !!errors["start_date"]}
                    message={errors["finish_at"] || errors["start_date"]}
                    value={editActions.getStartDate()}
                    min={Time.from(Date.now())
                      .startOf("day")
                      .format(Time.Formats.InputDate)}
                    onChange={editActions.handleChange}
                    kind="full"
                  />
                </Grid.Column>
                {!editing.all_day && (
                  <Grid.Column mobile="6">
                    <Field
                      label={l("page.submit.start_time_label")}
                      name="start_time"
                      type="time"
                      error={!!errors["start_at"] || !!errors["start_time"]}
                      message={errors["start_time"]}
                      value={editActions.getStartTime()}
                      onChange={editActions.handleChange}
                      kind="full"
                    />
                  </Grid.Column>
                )}
                {!editing.all_day && (
                  <Grid.Column mobile="2">
                    <Paragraph className="FieldNote">
                      {l("general.utc")}
                    </Paragraph>
                  </Grid.Column>
                )}
                <Grid.Column mobile="8">
                  <Field
                    label={l("page.submit.end_date_label")}
                    name="finish_date"
                    type="date"
                    error={!!errors["finish_at"] || !!errors["finish_date"]}
                    message={
                      errors["finish_at"] ||
                      errors["finish_date"] || (
                        <Info
                          text={
                            l("page.submit.maximum_allowed_duration") +
                            " " +
                            editActions.getMaxHoursAllowedLabel()
                          }
                        />
                      )
                    }
                    value={editActions.getFinishDate()}
                    min={editActions.getStartDate()}
                    onChange={editActions.handleChange}
                    kind="full"
                  />
                </Grid.Column>
                {!editing.all_day && (
                  <Grid.Column mobile="6">
                    <Field
                      label={l("page.submit.end_time_label")}
                      name="finish_time"
                      type="time"
                      error={!!errors["finish_at"] || !!errors["finish_time"]}
                      message={errors["finish_time"]}
                      value={editActions.getFinishTime()}
                      onChange={editActions.handleChange}
                      kind="full"
                    />
                  </Grid.Column>
                )}
                {!editing.all_day && (
                  <Grid.Column mobile="2">
                    <Paragraph className="FieldNote">
                      {l("general.utc")}
                    </Paragraph>
                  </Grid.Column>
                )}
                <Grid.Column mobile="16">
                  <Divider size="mini" />
                </Grid.Column>
                <Grid.Column mobile="8">
                  <SelectField
                    label={l("page.submit.recurrent_label")}
                    search={false}
                    placeholder={l("page.submit.recurrent_placeholder")}
                    name="recurrent"
                    error={!!errors["recurrent"]}
                    message={errors["recurrent"]}
                    options={recurrentOptions}
                    value={!!editing.recurrent}
                    onChange={editActions.handleChange}
                    border
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
                      kind="full"
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
                      border
                    />
                  </Grid.Column>
                )}
                {editing.recurrent &&
                  editing.recurrent_frequency === Frequency.WEEKLY && (
                    <Grid.Column mobile="16">
                      <RadioGroup label="Repeat on">
                        <Radio
                          label={l("page.submit.day_sun_label")}
                          name="recurrent_weekday_mask[SUNDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.SUNDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
                                (editing.recurrent_weekday_mask || 0) &
                                WeekdayMask.SUNDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label={l("page.submit.day_mon_label")}
                          name="recurrent_weekday_mask[MONDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.MONDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
                                (editing.recurrent_weekday_mask || 0) &
                                WeekdayMask.MONDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label={l("page.submit.day_tue_label")}
                          name="recurrent_weekday_mask[TUESDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.TUESDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
                                (editing.recurrent_weekday_mask || 0) &
                                WeekdayMask.TUESDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label={l("page.submit.day_wed_label")}
                          name="recurrent_weekday_mask[WEDNESDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.WEDNESDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
                                (editing.recurrent_weekday_mask || 0) &
                                WeekdayMask.WEDNESDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label={l("page.submit.day_thu_label")}
                          name="recurrent_weekday_mask[THURSDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.THURSDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
                                (editing.recurrent_weekday_mask || 0) &
                                WeekdayMask.THURSDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label={l("page.submit.day_fri_label")}
                          name="recurrent_weekday_mask[FRIDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.FRIDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
                                (editing.recurrent_weekday_mask || 0) &
                                WeekdayMask.FRIDAY
                              ),
                            })
                          }
                        />
                        <Radio
                          label={l("page.submit.day_sat_label")}
                          name="recurrent_weekday_mask[SATURDAY]"
                          checked={Boolean(
                            (editing.recurrent_weekday_mask || 0) &
                              WeekdayMask.SATURDAY
                          )}
                          onClick={(e, data) =>
                            editActions.handleChange(e, {
                              ...data,
                              checked: !(
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
                      <RadioGroup label={l("page.submit.repeat_on_label")}>
                        <div style={{ flex: "1 1 100%", marginBottom: ".7em" }}>
                          <Radio
                            label={l("page.submit.recurrent_monthday_label", {
                              date: editing.start_at.getUTCDate(),
                            })}
                            name="recurrent_monthday[current]"
                            checked={editing.recurrent_monthday !== null}
                            onClick={editActions.handleChange}
                          />
                        </div>
                        <div style={{ flex: "1 1 100%", marginBottom: ".7em" }}>
                          <Radio
                            label={l(
                              "page.submit.recurrent_setpos_current_label",
                              {
                                name: toRecurrentSetposName(editing.start_at),
                                day: Time.from(
                                  editing.start_at,
                                  options
                                ).format("dddd"),
                              }
                            )}
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
                              label={l(
                                "page.submit.recurrent_setpos_last_label",
                                {
                                  day: Time.from(
                                    editing.start_at,
                                    options
                                  ).format("dddd"),
                                }
                              )}
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
                      label={l("page.submit.ends_label")}
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
                      border
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
                      kind="full"
                    />
                  </Grid.Column>
                )}
                {editing.recurrent && editing.recurrent_count !== null && (
                  <Grid.Column mobile="5">
                    <Paragraph className="FieldNote">
                      {l("page.submit.occurrences")}
                    </Paragraph>
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
                      kind="full"
                    />
                  </Grid.Column>
                )}
                {editing.recurrent && recurrent_date.length > 0 && (
                  <Grid.Column mobile="16">
                    <Label>
                      {l("page.submit.dates")} ({recurrent_date.length}):{" "}
                    </Label>
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
                  <Label>{l("page.submit.categories_label")}</Label>
                  <Paragraph tiny secondary>
                    {l("page.submit.want_new_category_label")}{" "}
                    <span className={"submit__category__dao"}>
                      {l("general.dao")}
                    </span>
                    .
                  </Paragraph>
                  <SelectField
                    placeholder={l("page.submit.add_category_placeholder")}
                    name="categories"
                    error={!!errors["categories"]}
                    message={errors["categories"]}
                    options={categoryOptions}
                    onChange={editActions.handleChange}
                    value={
                      editing.categories.length > 0 ? editing.categories[0] : ""
                    }
                    disabled={categoryOptions.length === 0}
                    border
                  />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="16">
                  <Divider size="tiny" />
                </Grid.Column>
              </Grid.Row>
              {!ff.flags[Flags.HideEventsInWorlds] && (
                <Grid.Row>
                  <Grid.Column mobile="16">
                    <SelectField
                      label={l("page.submit.location_label")}
                      placeholder={l("page.submit.location_placeholder")}
                      name="event_location"
                      className="submit__location-select"
                      options={locationOptions}
                      value={
                        editing.world
                          ? eventLocations.WORLD
                          : eventLocations.LAND
                      }
                      onChange={editActions.handleChange}
                      border
                    />
                    {editing.world && (
                      <Info
                        text={l("page.submit.limit_attendees_label", {
                          limit: <b>{l("page.submit.limit_attendees")}</b>,
                        })}
                      />
                    )}
                  </Grid.Column>
                </Grid.Row>
              )}
              <Grid.Row>
                <Grid.Column mobile="16">
                  <SelectField
                    label={
                      editing.world
                        ? l("page.submit.world_label")
                        : l("page.submit.server_label")
                    }
                    placeholder={
                      editing.world
                        ? l("page.submit.world_placeholder")
                        : l("page.submit.server_placeholder")
                    }
                    className="submit__server-select"
                    name="server"
                    error={!!errors["server"]}
                    message={errors["server"]}
                    options={serverOptions}
                    value={editing.server || ""}
                    onChange={editActions.handleChange}
                    border
                  />
                </Grid.Column>
              </Grid.Row>

              {!editing.world && (
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field
                      label={l("page.submit.latitude_label")}
                      type="number"
                      name="x"
                      min="-170"
                      max="170"
                      error={!!errors["x"]}
                      message={errors["x"]}
                      value={editing.x}
                      onChange={editActions.handleChange}
                      kind="full"
                    />
                  </Grid.Column>
                  <Grid.Column mobile="4">
                    <Field
                      label={l("page.submit.longitude_label")}
                      type="number"
                      name="y"
                      min="-170"
                      max="170"
                      error={!!errors["y"]}
                      message={errors["y"]}
                      value={editing.y}
                      onChange={editActions.handleChange}
                      kind="full"
                    />
                  </Grid.Column>
                </Grid.Row>
              )}

              <Grid.Row>
                <Grid.Column mobile="16">
                  <Divider size="tiny" />
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column mobile="16">
                  <Field
                    disabled={
                      original ? original.user !== settings.user : false
                    }
                    label={l("page.submit.contact_label")}
                    placeholder={l("page.submit.contact_placeholder")}
                    name="contact"
                    error={!!errors["contact"]}
                    message={errors["contact"]}
                    value={editing.contact}
                    onChange={editActions.handleChange}
                    kind="full"
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
                <Grid.Column mobile="16" className="submit__row-details">
                  <TextAreaField
                    disabled={
                      original ? original.user !== settings.user : false
                    }
                    label={l("page.submit.details_label")}
                    placeholder={l("page.submit.details_placeholder")}
                    name="details"
                    error={errors["details"]}
                    message={errors["details"]}
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
                      Boolean(
                        original &&
                          original.user !== settings.user &&
                          !canEditAnyEvent(settings)
                      ) ||
                      submitting ||
                      removing ||
                      notifying
                    }
                    style={{ width: "100%" }}
                    onClick={submit}
                  >
                    {submitButtonLabel}
                  </Button>
                </Grid.Column>
                <Grid.Column mobile="5">
                  {original &&
                    (original.user === settings.user ||
                      canApproveAnyEvent(settings)) && (
                      <Button
                        basic
                        loading={submitting || removing || notifying}
                        disabled={submitting || removing || notifying}
                        style={{ width: "100%" }}
                        onClick={handleReject}
                      >
                        {(original.user === settings.user &&
                          l("page.submit.delete")) ||
                          l("page.submit.reject")}
                      </Button>
                    )}
                </Grid.Column>
                <Grid.Column mobile="5">
                  {original && canTestAnyNotification(settings) && (
                    <Button
                      basic
                      loading={submitting || removing || notifying}
                      disabled={submitting || removing || notifying}
                      style={{ width: "100%" }}
                      onClick={prevent(() => notify())}
                    >
                      {l("page.submit.notify_me")}
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
                  <Info
                    text={l("page.submit.event_submission_will_be_reviewed")}
                  />
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
        <Title>{l("page.submit.confirm_modal.title")}</Title>
        <Paragraph>
          <Markdown>
            {l("page.submit.confirm_modal.paragraph", {
              name: original?.name || "this",
            })}
          </Markdown>
        </Paragraph>
        {state.error && <Paragraph primary>{state.error}</Paragraph>}
        <Button
          primary
          onClick={prevent(() => remove())}
          loading={submitting || removing}
          style={{ marginTop: "28px" }}
        >
          {l("page.submit.confirm_modal.submit")}
        </Button>
      </ConfirmModal>
    </>
  )
}
