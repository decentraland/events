import React, { useState, useEffect } from "react"
import { useLocation } from '@reach/router'
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import { Field } from 'decentraland-ui/dist/components/Field/Field'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { toInputDate } from "decentraland-gatsby/dist/components/Date/utils"
import track from "decentraland-gatsby/dist/components/Segment/track"

import Layout from "../components/Layout/Layout"
import SEO from "../components/seo"
import useEventEditor from "../hooks/useEventEditor"
import BackButton from "../components/Button/BackButton"
import WalletRequiredModal from "../components/WalletRequiredModal/WalletRequiredModal"
import url from '../utils/url'
import * as segment from '../utils/segment'

import './submit.css'

const info = require('../images/info.svg')

type SubmitPageState = {
  loading?: boolean,
  error?: string | null
}

export default function SubmitPage(props: any) {

  const location = useLocation()
  const [profile, profileActions] = useProfile()
  const [state, setState] = useState<SubmitPageState>({})
  const [event, eventActions] = useEventEditor()
  const [requireWallet, setRequireWallet] = useState(false)

  useEffect(() => {
    if (Boolean(profileActions.error && profileActions.error.code === 'CONNECT_ERROR')) {
      setRequireWallet(true)
    }
  }, [profileActions.error, profileActions.error && profileActions.error.code])

  useEffect(() => track((analytics) => analytics.page(segment.Page.Submit)), [])

  function handleBack(event: React.MouseEvent<any>) {
    event.stopPropagation()
    event.preventDefault()
    window.location = '/' as any
  }

  function handleSubmit() {
    if (state.loading) {
      return
    }

    if (!eventActions.validate()) {
      return
    }

    setState({ loading: true })
    eventActions.create()
      .then((event) => {
        track((analytics) => analytics.track(segment.Track.NewEvent, { event }))
        const newLocation = { ...location, pathname: location.pathname.replace('/submit', '') }
        const target = event && event.id ? url.toEvent(newLocation, event.id) : url.toHome(newLocation)
        window.location = target as any
      })
      .catch((error) => {
        console.log(error)
        setState({ loading: false, error: error.message })
      })
  }

  const errors = event.errors

  return (
    <Layout {...props} >
      <SEO title="Submit event" />
      <Container style={{ paddingTop: '110px' }}>
        <WalletRequiredModal open={requireWallet} onClose={() => setRequireWallet(false)} />
        {!profile && <Grid stackable>
          <Grid.Row centered>
            <Grid.Column mobile="8" textAlign="center" style={{ paddingTop: '30vh', paddingBottom: '30vh' }}>
              {profileActions.loading && <Loader size="big" />}
              <Paragraph secondary>You need to <Link onClick={() => profileActions.connect()}>sign in</Link> before to submit an event</Paragraph>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
        {profile && <Grid stackable>
          <Grid.Row>
            <Grid.Column style={{ width: '58px', paddingRight: '8px' }}>
              <BackButton to="/" onClick={handleBack} style={{ margin: '5px 3px' }} />
            </Grid.Column>
            <Grid.Column mobile="15">
              <Title style={{ fontSize: '34px', lineHeight: '42px' }}>Submit event</Title>
              <Paragraph secondary>Be sure to fill in as many details as possible to generate interest in your event.</Paragraph>
              <Grid stackable style={{ paddingTop: '48px' }}>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Event Name" placeholder="Be as descriptive as you can" style={{ width: '100%' }} name="name" error={!!errors['name']} message={errors['name']} defaultValue={event.name} onChange={eventActions.handleChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Description" placeholder="Keep it short but keep it interesting!" name="description" error={!!errors['description']} message={errors['description']} defaultValue={event.description} onChange={eventActions.handleChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field label="Start date" name="start_date" type="date" error={!!errors['start_at'] || !!errors['start_date']} message={errors['finish_at'] || errors['start_date']} value={eventActions.getStartDate()} min={toInputDate(new Date())} onChange={eventActions.handleChange} />
                  </Grid.Column>
                  <Grid.Column mobile="3">
                    <Field label="Start time" name="start_time" type="time" error={!!errors['start_at'] || !!errors['start_time']} message={errors['start_time']} value={eventActions.getStartTime()} onChange={eventActions.handleChange} />
                  </Grid.Column>
                  <Grid.Column mobile="1">
                    <Paragraph className="FieldNote">UTC</Paragraph>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field label="End date" name="finish_date" type="date" error={!!errors['finish_at'] || !!errors['finish_date']} message={errors['finish_at'] || errors['finish_date']} value={eventActions.getFinishDate()} min={toInputDate(event.start_at)} onChange={eventActions.handleChange} />
                  </Grid.Column>
                  <Grid.Column mobile="3">
                    <Field label="End time" name="finish_time" type="time" error={!!errors['finish_at'] || !!errors['finish_time']} message={errors['finish_time']} value={eventActions.getFinishTime()} onChange={eventActions.handleChange} />
                  </Grid.Column>
                  <Grid.Column mobile="1">
                    <Paragraph className="FieldNote">UTC</Paragraph>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field label="Decentraland coordinates" name="coordinates" error={!!errors['coordinates']} message={errors['coordinates']} defaultValue={event.coordinates.join(',')} onChange={eventActions.handleChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Email or Discord username" placeholder="hello@decentraland.org" name="contact" error={!!errors['contact']} message={errors['contact']} defaultValue={event.name} onChange={eventActions.handleChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Additional info" placeholder="Add any other useful details for our reviewers" name="details" error={!!errors['details']} message={errors['details']} defaultValue={event.name} onChange={eventActions.handleChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Button primary loading={state.loading} disabled={state.loading} style={{ width: '212px' }} onClick={handleSubmit}>SUBMIT</Button>
                  </Grid.Column>
                </Grid.Row>
                {state.error && <Grid.Row>
                  <Grid.Column mobile="8">
                    <Paragraph style={{ color: '#ff0000' }}>{state.error}</Paragraph>
                  </Grid.Column>
                </Grid.Row>}
                <Grid.Row>
                  <Grid.Column mobile="8">
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
    </Layout >
  )
}
