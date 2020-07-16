import React, { useEffect, useMemo } from "react"
import { useLocation } from '@reach/router'
import { Container } from "decentraland-ui/dist/components/Container/Container"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import { Field } from 'decentraland-ui/dist/components/Field/Field'
import { SelectField } from 'decentraland-ui/dist/components/SelectField/SelectField'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Radio } from "decentraland-ui/dist/components/Radio/Radio"
import { toInputDate, toDayName, toUTCInputDate, toMonthName } from "decentraland-gatsby/dist/components/Date/utils"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import Bold from "decentraland-gatsby/dist/components/Text/Bold"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import { navigate } from 'gatsby-plugin-intl'

import Layout from "../components/Layout/Layout"
import SEO from "../components/seo"
import useEventEditor from "../hooks/useEventEditor"
import BackButton from "../components/Button/BackButton"
import AddCoverButton from "../components/Button/AddCoverButton"
import ConfirmModal from "../components/Modal/ConfirmModal"
import WalletRequiredModal from "../components/Modal/WalletRequiredModal"
import useSiteStore from '../hooks/useSiteStore'
import useAnalytics from '../hooks/useAnalytics'
import * as segment from '../utils/segment'
import url from '../utils/url'

import ImageInput from "../components/Form/ImageInput"
import Textarea from "../components/Form/Textarea"
import Label from "../components/Form/Label"
import RadioGroup from "../components/Form/RadioGroup"
import Events, { EditEvent } from "../api/Events"
import { POSTER_FILE_SIZE, POSTER_FILE_TYPES } from "../entities/Poster/types"
import { Frequency, WeekdayMask, Position, Weekdays, MAX_EVENT_RECURRENT } from "../entities/Event/types"
import { isLatestRecurrentSetpos, toRecurrentSetposName, toRRuleWeekdays, toRRuleMonths, toRRuleDates } from "../entities/Event/utils"

import './submit.css'

const info = require('../images/info.svg')

let GLOBAL_LOADING = false;

type SubmitPageState = {
  dragging?: boolean,
  loading?: boolean,
  uploadingPoster?: boolean,
  requireWallet?: boolean,
  requireConfirmation?: boolean,
  previewingDescription?: boolean,
  errorImageSize?: boolean,
  errorImageFormat?: boolean,
  errorImageServer?: string | null,
  error?: string | null,
}

export default function SubmitPage(props: any) {
  const location = useLocation()
  const [state, patchState] = usePatchState<SubmitPageState>({})
  const eventId = url.getEventId(location) || null
  const siteStore = useSiteStore(props.location)
  const siteState = siteStore.events.getState()
  const [editing, editActions] = useEventEditor()
  const realmOptions = useMemo(() => {
    const result: { key: string, value: string, text: string }[] = [
      { key: 'default', value: '', text: 'any realm' }
    ]
    const realms = siteStore.realms.getList() || []
    for (let realm of realms) {
      for (let layer of realm.layers) {
        const value = `${realm.id}-${layer}`
        const key = `${value}-${realm.url}`
        result.push({ key, value, text: value })
      }
    }

    return result
  }, [siteStore.realms.getState()])

  const recurrentOptions = useMemo(() => {
    return [
      { value: false, text: 'Does not repeat' },
      { value: true, text: 'Repeat every' }
    ]
  }, [])

  const recurrentFrequencyOptions = useMemo(() => {
    const moreThanOne = editing.recurrent_interval > 1
    return [
      { value: Frequency.DAILY, text: moreThanOne ? 'days' : 'day' },
      { value: Frequency.WEEKLY, text: moreThanOne ? 'weeks' : 'week' },
      { value: Frequency.MONTHLY, text: moreThanOne ? 'month' : 'month' }
    ]
  }, [editing.recurrent_interval])

  const recurrentEndsOptions = useMemo(() => [
    { value: 'count', text: 'After' },
    { value: 'until', text: 'On' },
  ], [])

  const recurrent_date = useMemo(() => toRRuleDates(editing, (_, i) => i < MAX_EVENT_RECURRENT), [
    editing.start_at,
    editing.recurrent,
    editing.recurrent_count,
    editing.recurrent_until,
    editing.recurrent_frequency,
    editing.recurrent_interval,
    editing.recurrent_month_mask,
    editing.recurrent_weekday_mask,
    editing.recurrent_setpos,
    editing.recurrent_monthday
  ])

  useEffect(() => { GLOBAL_LOADING = false }, [])

  useEffect(() => {
    if (siteStore.connectError === 'CONNECT_ERROR') {
      patchState({ requireWallet: true })
    }
  }, [siteStore.connectError])

  useAnalytics((analytics) => analytics.page(segment.Page.Submit))

  useEffect(() => {
    if (eventId) {
      const original = siteStore.events.getEntity(eventId)

      if (original) {
        editActions.setValues({
          name: original.name,
          image: original.image,
          description: original.description,
          x: original.x,
          y: original.y,
          realm: original.realm,
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
        })
      }
    }
  }, [siteState.loading])

  function handlePoster(file: File) {
    if (state.uploadingPoster) {
      return
    } else if (!POSTER_FILE_TYPES.includes(file.type)) {
      patchState({ errorImageSize: false, errorImageFormat: true, errorImageServer: null })
    } else if (POSTER_FILE_SIZE < file.size) {
      patchState({ errorImageSize: true, errorImageFormat: false, errorImageServer: null })
    } else {
      patchState({ errorImageSize: false, errorImageFormat: false, errorImageServer: null, uploadingPoster: true })
      Events.get().uploadPoster(file)
        .then((poster) => {
          patchState({ uploadingPoster: false })
          editActions.setValue('image', poster.url)
        })
        .catch((err) => patchState({ uploadingPoster: false, errorImageServer: err.message }))
    }
  }

  function handleSubmit(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    if (GLOBAL_LOADING) {
      return null
    }

    if (state.loading) {
      return null
    }

    if (!editActions.validate()) {
      return null
    }

    GLOBAL_LOADING = true
    patchState({ loading: true, error: null })

    const data = editActions.toObject()
    const submit = eventId ? siteStore.updateEvent(eventId, data) : siteStore.createEvent(data as EditEvent)
    submit
      .then((event) => {
        GLOBAL_LOADING = false
        navigate(url.toEvent(location, event.id), siteStore.getNavigationState())
      })
      .catch((error) => {
        GLOBAL_LOADING = false
        patchState({ loading: false, error: error.message })
      })
  }

  function handleReject(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    if (eventId) {
      patchState({ requireConfirmation: true, error: null })
    }
  }

  function handleConfirmReject(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    if (eventId) {
      GLOBAL_LOADING = true
      patchState({ loading: true, error: null })
      siteStore.updateEvent(eventId, { rejected: true })
        .then(() => {
          GLOBAL_LOADING = false
          navigate(url.toHome(location), siteStore.getNavigationState())
        })
        .catch((err) => {
          GLOBAL_LOADING = false
          patchState({ loading: false, error: err.message })
        })
    }
  }

  function handleDragStart(event: React.DragEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    patchState({ dragging: true })
  }

  function handleDragEnd(event: React.DragEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    patchState({ dragging: false })
  }

  function handleDragOver(event: React.DragEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
  }

  function handleDrop(event: React.DragEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    const files = event.dataTransfer?.files
    if (!files) {
      return
    }

    const file = files[0]
    if (!file) {
      return file
    }

    handlePoster(file)
  }

  function handleSettings(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    navigate(url.toSettings(location), siteStore.getNavigationState())
  }

  function handleBack(event: React.MouseEvent<any>) {
    event.preventDefault()
    event.stopPropagation()
    navigate(eventId ? url.toEvent(location, eventId) : url.toHome(location), siteStore.getNavigationState())
  }

  const errors = editing.errors
  const coverError = state.errorImageSize || state.errorImageFormat || !!state.errorImageServer
  const event = eventId && siteStore.events.getEntity(eventId) || null
  const now = Date.now()

  return (
    <Layout {...props} onOpenProfile={handleSettings}>
      <SEO title="Submit event" />
      <ConfirmModal open={state.requireConfirmation} onClose={() => patchState({ requireConfirmation: false })}>
        <Title>Are you absolutely sure?</Title>
        <Paragraph>This action <Bold>cannot</Bold> be undone. This will permanently delete the <Bold>{event ? event.name : 'this'}</Bold> event</Paragraph>
        {state.error && <Paragraph primary>{state.error}</Paragraph>}
        <Button primary onClick={handleConfirmReject} loading={state.loading} style={{ marginTop: '28px' }}>YES, DELETE THIS EVENT</Button>
      </ConfirmModal>
      <div onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={handleDrop} >
        <Container style={{ paddingTop: '110px' }}>
          <WalletRequiredModal open={!!state.requireWallet} onClose={() => patchState({ requireWallet: false })} />
          {siteStore.loading && <Grid stackable>
            <Grid.Row centered>
              <Grid.Column mobile="16" textAlign="center" style={{ paddingTop: '30vh', paddingBottom: '30vh' }}>
                <Loader size="big" />
              </Grid.Column>
            </Grid.Row>
          </Grid>}
          {!siteStore.loading && !siteStore.profile && <Grid stackable>
            <Grid.Row centered>
              <Grid.Column mobile="16" textAlign="center" style={{ paddingTop: '30vh', paddingBottom: '30vh' }}>
                <Paragraph secondary>You need to <Link onClick={() => siteStore.connect()}>sign in</Link> before to submit an event</Paragraph>
              </Grid.Column>
            </Grid.Row>
          </Grid>}
          {!siteStore.loading && siteStore.profile && <Grid stackable>
            <Grid.Row>
              <Grid.Column style={{ width: '58px', paddingRight: '8px' }}>
                <BackButton to={eventId ? url.toEvent(location, eventId) : url.toHome(location)} style={{ margin: '5px 3px' }} onClick={handleBack} />
              </Grid.Column>
              <Grid.Column mobile="15" style={{ maxWidth: '580px' }}>
                <Title style={{ fontSize: '34px', lineHeight: '42px' }}>Submit event</Title>
                <Paragraph secondary>Be sure to fill in as many details as possible to generate interest in your event.</Paragraph>
                <Grid stackable>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <ImageInput label="Event Cover" value={editing.image || ''} onFileChange={handlePoster} loading={state.uploadingPoster} error={coverError} message={
                        state.errorImageSize && <>This image is too heavy (more than 500Kb), try with <a href="https://imagecompressor.com/" target="_blank"><strong>optimizilla</strong></a></> ||
                        state.errorImageFormat && <>This file format is not supported, try with <strong>jpg</strong>, <strong>png</strong> or <strong>gif</strong></> ||
                        state.errorImageServer || ''}>
                        <div className="ImageInput__Description">
                          <AddCoverButton />
                          <Paragraph>
                            <span className="ImageInput__Description__Primary">Browse</span> your computer or <br /> drag a picture to add a cover
                          </Paragraph>
                        </div>
                      </ImageInput>
                    </Grid.Column>
                  </Grid.Row>
                  {siteStore.event && siteStore.event.editable && <Grid.Row>
                    <Grid.Column mobile="16">
                      <Label style={{ marginBottom: '1em' }}>Advance</Label>
                    </Grid.Column>
                    <Grid.Column mobile="4">
                      <Radio name="highlighted" label="HIGHLIGHT" checked={editing.highlighted} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !editing.highlighted })} />
                    </Grid.Column>
                    <Grid.Column mobile="4">
                      <Radio name="trending" label="TRENDING" checked={editing.trending} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !editing.trending })} />
                    </Grid.Column>
                  </Grid.Row>}
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Field label="Event Name" placeholder="Be as descriptive as you can" style={{ width: '100%' }} name="name" error={!!errors['name']} message={errors['name']} value={editing.name} onChange={editActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Radio toggle label="PREVIEW" checked={state.previewingDescription} onChange={(_, ctx) => patchState({ previewingDescription: ctx.checked })} style={{ position: 'absolute', right: 0 }} />
                      {!state.previewingDescription && <Textarea minHeight={72} maxHeight={500} label="Description" placeholder="Keep it short but keep it interesting!" name="description" error={!!errors['description']} message={errors['description']} value={editing.description} onChange={editActions.handleChange} />}
                      {state.previewingDescription && <Label>Description</Label>}
                      {state.previewingDescription && <div style={{ minHeight: '72px', paddingTop: '4px', paddingBottom: '12px' }}><Markdown source={editing.description} /></div>}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Divider size="tiny" />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Label style={{ cursor: 'pointer' }}>
                        All day event ?
                        <Radio toggle name="all_day" checked={editing.all_day} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !editing.all_day })} style={{ marginLeft: '1em', verticalAlign: 'bottom' }} />
                      </Label>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="8">
                      <Field label="Start date" name="start_date" type="date" error={!!errors['start_at'] || !!errors['start_date']} message={errors['finish_at'] || errors['start_date']} value={editActions.getStartDate()} min={toInputDate(new Date())} onChange={editActions.handleChange} />
                    </Grid.Column>
                    {!editing.all_day && <Grid.Column mobile="6">
                      <Field label="Start time" name="start_time" type="time" error={!!errors['start_at'] || !!errors['start_time']} message={errors['start_time']} value={editActions.getStartTime()} onChange={editActions.handleChange} />
                    </Grid.Column>}
                    {!editing.all_day && <Grid.Column mobile="2">
                      <Paragraph className="FieldNote">UTC</Paragraph>
                    </Grid.Column>}
                    <Grid.Column mobile="8">
                      <Field label="End date" name="finish_date" type="date" error={!!errors['finish_at'] || !!errors['finish_date']} message={errors['finish_at'] || errors['finish_date']} value={editActions.getFinishDate()} min={editActions.getStartDate()} onChange={editActions.handleChange} />
                    </Grid.Column>
                    {!editing.all_day && <Grid.Column mobile="6">
                      <Field label="End time" name="finish_time" type="time" error={!!errors['finish_at'] || !!errors['finish_time']} message={errors['finish_time']} value={editActions.getFinishTime()} onChange={editActions.handleChange} />
                    </Grid.Column>}
                    {!editing.all_day && <Grid.Column mobile="2">
                      <Paragraph className="FieldNote">UTC</Paragraph>
                    </Grid.Column>}
                    <Grid.Column mobile="8">
                      <SelectField label="Repeat" search={false} placeholder="Does not repeat" name="recurrent" error={!!errors['recurrent']} message={errors['recurrent']} options={recurrentOptions} value={!!editing.recurrent} onChange={editActions.handleChange} />
                    </Grid.Column>
                    {editing.recurrent && <Grid.Column mobile="4">
                      <Field label="&nbsp;" type="number" name="recurrent_interval" error={!!errors['recurrent_interval']} message={errors['recurrent_interval']} value={editing.recurrent_interval} onChange={editActions.handleChange} />
                    </Grid.Column>}
                    {editing.recurrent && <Grid.Column mobile="4">
                      <SelectField label="&nbsp;" search={false} name="recurrent_frequency" error={!!errors['recurrent_frequency']} message={errors['recurrent_frequency']} options={recurrentFrequencyOptions} value={editing.recurrent_frequency || Frequency.DAILY} onChange={editActions.handleChange} />
                    </Grid.Column>}
                    {editing.recurrent && editing.recurrent_frequency === Frequency.WEEKLY && <Grid.Column mobile="16">
                      <RadioGroup label="Repeat on">
                        <Radio label="SUN" name="recurrent_weekday_mask[SUNDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.SUNDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.SUNDAY) })} />
                        <Radio label="MON" name="recurrent_weekday_mask[MONDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.MONDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.MONDAY) })} />
                        <Radio label="TUE" name="recurrent_weekday_mask[TUESDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.TUESDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.TUESDAY) })} />
                        <Radio label="WED" name="recurrent_weekday_mask[WEDNESDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.WEDNESDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.WEDNESDAY) })} />
                        <Radio label="THU" name="recurrent_weekday_mask[THURSDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.THURSDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.THURSDAY) })} />
                        <Radio label="FRI" name="recurrent_weekday_mask[FRIDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.FRIDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.FRIDAY) })} />
                        <Radio label="SAT" name="recurrent_weekday_mask[SATURDAY]" checked={Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.SATURDAY)} onClick={(e, data) => editActions.handleChange(e, { ...data, checked: !Boolean((editing.recurrent_weekday_mask || 0) & WeekdayMask.SATURDAY) })} />
                      </RadioGroup>
                    </Grid.Column>}
                    {editing.recurrent && editing.recurrent_frequency === Frequency.MONTHLY && <Grid.Column mobile="16">
                      <RadioGroup label="Repeat on">
                        <div style={{ flex: '1 1 100%', marginBottom: '.7em' }}>
                          <Radio label={`Monthly on day ${editing.start_at.getUTCDate()}`} name="recurrent_monthday[current]" checked={editing.recurrent_monthday !== null} onClick={editActions.handleChange} />
                        </div>
                        <div style={{ flex: '1 1 100%', marginBottom: '.7em' }}>
                          <Radio label={`Monthly on the ${toRecurrentSetposName(editing.start_at)} ${toDayName(editing.start_at, { utc: true, capitalized: true })}`} name="recurrent_setpos[current]" checked={editing.recurrent_setpos !== null && editing.recurrent_setpos !== Position.LAST} onChange={editActions.handleChange} />
                        </div>
                        {isLatestRecurrentSetpos(editing.start_at) && <div style={{ flex: '1 1 100%', marginBottom: '.7em' }}>
                          <Radio label={`Monthly on the last ${toDayName(editing.start_at, { utc: true, capitalized: true })}`} name="recurrent_setpos[last]" checked={editing.recurrent_setpos === Position.LAST} onChange={editActions.handleChange} />
                        </div>}
                      </RadioGroup>
                    </Grid.Column>}
                    {editing.recurrent && <Grid.Column mobile="8">
                      <SelectField label="Ends" name="recurrent_end" search={false} error={!!errors['recurrent']} message={errors['recurrent']} value={editing.recurrent_count != null && 'count' || editing.recurrent_until !== null && 'until' || undefined} options={recurrentEndsOptions} onChange={editActions.handleChange} />
                    </Grid.Column>}
                    {editing.recurrent && editing.recurrent_count !== null && <Grid.Column mobile="3">
                      <Field label="&nbsp;" name="recurrent_count" type="number" error={!!errors['recurrent_count']} message={errors['recurrent_count']} value={editing.recurrent_count} onChange={editActions.handleChange} />
                    </Grid.Column>}
                    {editing.recurrent && editing.recurrent_count !== null && <Grid.Column mobile="5"><Paragraph className="FieldNote">Occurrences</Paragraph></Grid.Column>}
                    {editing.recurrent && editing.recurrent_until !== null && <Grid.Column mobile="8">
                      <Field label="&nbsp;" name="recurrent_until" type="date" value={toUTCInputDate(editing.recurrent_until)} onChange={editActions.handleChange} min={toInputDate(editing.start_at)} />
                    </Grid.Column>}
                    {editing.recurrent && recurrent_date.length > 0 && <Grid.Column mobile="16">
                      <Label>Dates ({recurrent_date.length}): </Label>
                    </Grid.Column>}
                    {editing.recurrent && recurrent_date.length > 0 && recurrent_date.map(date => <Grid.Column mobile="12" key={date.getTime()}>
                      <Paragraph secondary={date.getTime() + editing.duration < now}>
                        <span style={{ display: 'inline-block', minWidth: '8em', textAlign: 'right', marginRight: '.5em' }}>
                          {toDayName(date, { capitalized: true, utc: true })}
                          {', '}
                        </span>
                        <span style={{ display: 'inline-block', minWidth: '4em' }}>
                          {date.getUTCDate()}
                          {' '}
                          {toMonthName(date, { capitalized: true, utc: true })}
                          {' '}
                        </span>
                        {date.getUTCFullYear()}
                      </Paragraph>
                    </Grid.Column>)}
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Divider size="tiny" />
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column mobile="4">
                      <Field label="Latitude (X)" type="number" name="x" min="-150" max="150" error={!!errors['x']} message={errors['x']} value={editing.x} onChange={editActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="4">
                      <Field label="Longitude (Y)" type="number" name="y" min="-150" max="150" error={!!errors['y']} message={errors['y']} value={editing.y} onChange={editActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="8">
                      <SelectField label="Realm" placeholder="any realm" name="realm" error={!!errors['realm']} message={errors['realm']} options={realmOptions} value={editing.realm || ''} onChange={editActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Divider size="tiny" />
                    </Grid.Column>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Field disabled={!!siteStore.event && !siteStore.event.owned} label="Email or Discord username" placeholder="hello@decentraland.org" name="contact" error={!!errors['contact']} message={errors['contact']} value={editing.contact} onChange={editActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Textarea disabled={!!siteStore.event && !siteStore.event.owned} minHeight={72} maxHeight={500} label="Additional info" placeholder="Add any other useful details for our reviewers" name="details" error={!!errors['details']} message={errors['details']} value={editing.details} onChange={editActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="6">
                      <Button primary loading={state.loading} disabled={state.loading} style={{ width: '100%' }} onClick={handleSubmit}>
                        {event && 'SAVE'}
                        {!event && 'SUBMIT'}
                      </Button>
                    </Grid.Column>
                    <Grid.Column mobile="6">
                      {event && (event.owned || event.editable) && <Button basic loading={state.loading} disabled={state.loading} style={{ width: '100%' }} onClick={handleReject}>
                        DELETE
                      </Button>}
                    </Grid.Column>
                  </Grid.Row>
                  {state.error && <Grid.Row>
                    <Grid.Column mobile="16">
                      <Paragraph style={{ color: '#ff0000' }}>{state.error}</Paragraph>
                    </Grid.Column>
                  </Grid.Row>}
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Paragraph secondary tiny>
                        <img src={info} width="16" height="16" style={{ verticalAlign: 'middle', marginRight: '.5rem' }} />
                      The event submission will be reviewed by our team, you’ll be notified by email
                    </Paragraph>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Grid.Column>
            </Grid.Row>
          </Grid>}
        </Container>
      </div>
    </Layout >
  )
}
