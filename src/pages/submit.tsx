import React, { useEffect, useMemo } from "react"
import { useLocation } from '@reach/router'
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
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
import { toInputDate } from "decentraland-gatsby/dist/components/Date/utils"
import track from "decentraland-gatsby/dist/components/Segment/track"
import usePatchState from "decentraland-gatsby/dist/hooks/usePatchState"
import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import { navigate } from 'gatsby-plugin-intl'

import Layout from "../components/Layout/Layout"
import SEO from "../components/seo"
import useEventEditor from "../hooks/useEventEditor"
import BackButton from "../components/Button/BackButton"
import AddCoverButton from "../components/Button/AddCoverButton"
import WalletRequiredModal from "../components/WalletRequiredModal/WalletRequiredModal"
import url from '../utils/url'
import useSiteStore from '../hooks/useSiteStore'
import useAnalytics from '../hooks/useAnalytics'
import * as segment from '../utils/segment'

import ImageInput from "../components/Form/ImageInput"
import Textarea from "../components/Form/Textarea"
import Label from "../components/Form/Label"
import Events from "../api/Events"
import { POSTER_FILE_SIZE, POSTER_FILE_TYPES } from "../entities/Poster/types"
import './submit.css'

const info = require('../images/info.svg')

type SubmitPageState = {
  dragging?: boolean,
  loading?: boolean,
  uploadingPoster?: boolean,
  requireWallet?: boolean,
  previewingDescription?: boolean,
  errorImageSize?: boolean,
  errorImageFormat?: boolean,
  errorImageServer?: string | null,
  error?: string | null,
}

export default function SubmitPage(props: any) {

  const location = useLocation()
  const [profile, profileActions] = useProfile()
  const [state, patchState] = usePatchState<SubmitPageState>({})
  const eventId = url.getEventId(location)
  const siteStore = useSiteStore(props.location, { loading: !!eventId })
  const siteState = siteStore.events.getState()
  const [event, eventActions] = useEventEditor()
  const realmOptions = useMemo(() => {
    const result: { key: string, value: string, text: string }[] = [
      { key: 'default', value: '', text: 'any realm' }
    ]
    const realms = siteStore.realms.getList() || []
    for (let realm of realms) {
      for (let layer of realm.layers) {
        const key = `${realm.id}-${layer}`
        result.push({ key, text: key, value: key })
      }
    }

    return result
  }, [siteStore.realms.getState()])

  useEffect(() => {
    if (Boolean(profileActions.error && profileActions.error.code === 'CONNECT_ERROR')) {
      patchState({ requireWallet: true })
    }
  }, [profileActions.error, profileActions.error && profileActions.error.code])

  useAnalytics((analytics) => analytics.page(segment.Page.Submit))

  useEffect(() => {
    if (eventId) {
      const original = siteStore.events.getEntity(eventId)

      if (original) {
        eventActions.setValues({
          name: original.name,
          description: original.description,
          x: original.x,
          y: original.y,
          realm: original.realm,
          start_at: original.start_at,
          finish_at: original.finish_at,
          image: original.image,
          url: original.url,
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
          eventActions.setValue('image', poster.url)
        })
        .catch((err) => patchState({ uploadingPoster: false, errorImageServer: err.message }))
    }
  }

  function handleSubmit() {
    if (state.loading) {
      return
    }

    if (!eventActions.validate()) {
      return
    }

    patchState({ loading: true, error: null })

    const submit = eventId ? eventActions.update(eventId) : eventActions.create()
    submit
      .then((event) => {
        track((analytics) => analytics.track(segment.Track.NewEvent, { event }))
        siteStore.events.setEntity(event)
        navigate(url.toEvent(location, event.id), siteStore.getNavigationState())
      })
      .catch((error) => {
        console.error(error)
        patchState({ loading: false, error: error.message })
        track((analytics) => analytics.track(segment.Track.Error, { error: error.message, post: event, ...error }))
      })
  }

  function handleDragStart(event: React.DragEvent<any>) {
    event.preventDefault();
    patchState({ dragging: true })
  }

  function handleDragEnd(event: React.DragEvent<any>) {
    event.preventDefault();
    patchState({ dragging: false })
  }

  function handleDragOver(event: React.DragEvent<any>) {
    event.preventDefault();
  }

  function handleDrop(event: React.DragEvent<any>) {
    event.preventDefault();
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

  function handleBack(event: React.MouseEvent<any>) {
    event.preventDefault()
    navigate(eventId ? url.toEvent(location, eventId) : url.toHome(location), siteStore.getNavigationState())
  }

  const errors = event.errors
  const coverError = state.errorImageSize || state.errorImageFormat || !!state.errorImageServer

  return (
    <Layout {...props} >
      <SEO title="Submit event" />
      <div onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={handleDrop} >
        <Container style={{ paddingTop: '110px' }}>
          <WalletRequiredModal open={!!state.requireWallet} onClose={() => patchState({ requireWallet: false })} />
          {!profile && <Grid stackable>
            <Grid.Row centered>
              <Grid.Column mobile="16" textAlign="center" style={{ paddingTop: '30vh', paddingBottom: '30vh' }}>
                {profileActions.loading && <Loader size="big" />}
                <Paragraph secondary>You need to <Link onClick={() => profileActions.connect()}>sign in</Link> before to submit an event</Paragraph>
              </Grid.Column>
            </Grid.Row>
          </Grid>}
          {profile && <Grid stackable>
            <Grid.Row>
              <Grid.Column style={{ width: '58px', paddingRight: '8px' }}>
                <BackButton to={eventId ? url.toEvent(location, eventId) : url.toHome(location)} style={{ margin: '5px 3px' }} onClick={handleBack} />
              </Grid.Column>
              <Grid.Column mobile="15" style={{ maxWidth: '580px' }}>
                <Title style={{ fontSize: '34px', lineHeight: '42px' }}>Submit event</Title>
                <Paragraph secondary>Be sure to fill in as many details as possible to generate interest in your event.</Paragraph>
                <Grid stackable style={{ paddingTop: '48px' }}>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <ImageInput label="Event Cover" value={event.image || ''} onFileChange={handlePoster} loading={state.uploadingPoster} error={coverError} message={
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
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Field label="Event Name" placeholder="Be as descriptive as you can" style={{ width: '100%' }} name="name" error={!!errors['name']} message={errors['name']} value={event.name} onChange={eventActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Radio toggle label="PREVIEW" onChange={(_, ctx) => patchState({ previewingDescription: ctx.checked })} style={{ position: 'absolute', right: 0 }} />
                      {!state.previewingDescription && <Textarea minHeight={72} maxHeight={500} label="Description" placeholder="Keep it short but keep it interesting!" name="description" error={!!errors['description']} message={errors['description']} value={event.description} onChange={eventActions.handleChange} />}
                      {state.previewingDescription && <Label>Description</Label>}
                      {state.previewingDescription && <div style={{ minHeight: '72px', paddingTop: '4px', paddingBottom: '12px' }}><Markdown source={event.description} /></div>}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="8">
                      <Field label="Start date" name="start_date" type="date" error={!!errors['start_at'] || !!errors['start_date']} message={errors['finish_at'] || errors['start_date']} value={eventActions.getStartDate()} min={toInputDate(new Date())} onChange={eventActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="6">
                      <Field label="Start time" name="start_time" type="time" error={!!errors['start_at'] || !!errors['start_time']} message={errors['start_time']} value={eventActions.getStartTime()} onChange={eventActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="2">
                      <Paragraph className="FieldNote">UTC</Paragraph>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="8">
                      <Field label="End date" name="finish_date" type="date" error={!!errors['finish_at'] || !!errors['finish_date']} message={errors['finish_at'] || errors['finish_date']} value={eventActions.getFinishDate()} min={toInputDate(event.start_at)} onChange={eventActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="6">
                      <Field label="End time" name="finish_time" type="time" error={!!errors['finish_at'] || !!errors['finish_time']} message={errors['finish_time']} value={eventActions.getFinishTime()} onChange={eventActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="2">
                      <Paragraph className="FieldNote">UTC</Paragraph>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="4">
                      <Field label="Latitude" type="number" name="x" min="-150" max="150" error={!!errors['x']} message={errors['x']} value={event.x} onChange={eventActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="4">
                      <Field label="Longitude" type="number" name="y" min="-150" max="150" error={!!errors['y']} message={errors['y']} value={event.y} onChange={eventActions.handleChange} />
                    </Grid.Column>
                    <Grid.Column mobile="8">
                      <SelectField label="Realm" placeholder="any realm" name="realm" error={!!errors['realm']} message={errors['realm']} options={realmOptions} value={event.realm || ''} onChange={eventActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Field label="Email or Discord username" placeholder="hello@decentraland.org" name="contact" error={!!errors['contact']} message={errors['contact']} value={event.contact} onChange={eventActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="16">
                      <Field label="Additional info" placeholder="Add any other useful details for our reviewers" name="details" error={!!errors['details']} message={errors['details']} value={event.details} onChange={eventActions.handleChange} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column mobile="6">
                      <Button primary loading={state.loading} disabled={state.loading} style={{ width: '100%' }} onClick={handleSubmit}>SUBMIT</Button>
                    </Grid.Column>
                    <Grid.Column mobile="10"></Grid.Column>
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
