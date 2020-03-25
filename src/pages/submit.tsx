import React, { useState, useEffect } from "react"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import { InputOnChangeData } from "semantic-ui-react/dist/commonjs/elements/Input"
import { Field } from 'decentraland-ui/dist/components/Field/Field'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'
import { Button } from "decentraland-ui/dist/components/Button/Button"

import Layout from "../components/Layout/Layout"
import SEO from "../components/seo"
import Events, { NewEvent } from "../api/Events"
import BackButton from "../components/Button/BackButton"

import './submit.css'
import { toInputDate, toInputTime, fromInputDate, fromInputTime } from "../components/Date/utils"
import { navigate } from "gatsby-plugin-intl"

const info = require('../images/info.svg')

enum Status {
  None,
  Creating,
  Created
}

export default function IndexPage(props: any) {

  const [profile, loadingProfile, profileActions] = useProfile()
  const [creating, setCreating] = useState(Status.None)
  const [event, setEvent] = useState<NewEvent>({
    name: '',
    description: '',
    contact: '',
    details: '',
    coordinates: [0, 0],
    start_at: new Date(),
    finish_at: new Date(),
  })

  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  function handleValueChange(_: any, props: InputOnChangeData) {
    setErrors((current) => ({ ...current, general: undefined, [props.name]: undefined }))
    setEvent((current) => ({ ...current, [props.name]: props.value }))
  }

  function handleChangeStartDate(_: any, props: InputOnChangeData) {
    setErrors((current) => ({ ...current, general: undefined, [props.name]: undefined }))
    const start_at = fromInputDate(props.value, event.start_at)
    if (start_at !== event.start_at) {
      const finish_at = start_at.getTime() > event.finish_at.getTime() ? start_at : event.finish_at
      setEvent((current) => ({ ...current, start_at, finish_at }))
    }
  }

  function handleChangeStartTime(_: any, props: InputOnChangeData) {
    setErrors((current) => ({ ...current, general: undefined, [props.name]: undefined }))
    const start_at = fromInputTime(props.value, event.start_at)
    if (start_at !== event.start_at) {
      const finish_at = start_at.getTime() > event.finish_at.getTime() ? start_at : event.finish_at
      setEvent((current) => ({ ...current, start_at, finish_at }))
    }
  }

  function handleChangeFinishDate(_: any, props: InputOnChangeData) {
    setErrors((current) => ({ ...current, general: undefined, [props.name]: undefined }))
    const finish_at = fromInputDate(props.value, event.finish_at)
    if (finish_at !== event.finish_at) {
      setEvent((current) => ({ ...current, finish_at }))
    }
  }

  function handleChangeFinishTime(_: any, props: InputOnChangeData) {
    setErrors((current) => ({ ...current, general: undefined, [props.name]: undefined }))
    const finish_at = fromInputTime(props.value, event.finish_at)
    if (finish_at !== event.finish_at) {
      setEvent((current) => ({ ...current, finish_at }))
    }
  }

  function handleChangeCoordinates(_: any, props: InputOnChangeData) {
    setErrors((current) => ({ ...current, general: undefined, [props.name]: undefined }))
    let [x, y] = (props.value || '').split(',').map(Number)

    if (x <= 150 && x >= -150 && y <= 150 && y >= -150) {
      setEvent((current) => ({ ...current, coordinates: [x, y] }))
    } else {
      setErrors((current) => ({ ...current, coordinates: 'Invalid coordinates' }))
    }
  }

  function handleSubmit() {
    if (creating !== Status.None) {
      return
    }

    let newError = errors
    if (!event.name) {
      newError = { ...newError, name: 'This field is required' }
    }

    if (Object.keys(newError).filter(key => Boolean(newError[key])).length) {
      newError = {
        ...newError, general: 'Couldn\'t create this event because it has some errors'
      }
      console.log(newError)
      setErrors(newError)
    } else {
      setCreating(Status.Creating)
      const newEvent: Record<string, any> = {}
      for (const key of Object.keys(event) as (keyof NewEvent)[]) {
        if (event[key]) {
          const value = event[key] instanceof Date ? (event[key] as Date).toJSON() : event[key]
          newEvent[key] = value
        }
      }

      Events.get()
        .createEvent(newEvent as any)
        .then(() => {
          setCreating(Status.Created)
          navigate('/')
        })
        .catch(err => {
          const message = err.body?.error || err.message
          setCreating(Status.None)
          setErrors((current) => ({ ...current, general: 'Server error: ' + message }))
        })
    }
  }

  return (
    <Layout {...props} >
      <SEO title="Submit event" />
      <Container style={{ paddingTop: '110px' }}>
        {!profile && <Grid stackable>
          <Grid.Row centered>
            <Grid.Column mobile="8" textAlign="center" style={{ paddingTop: '30vh', paddingBottom: '30vh' }}>
              {loadingProfile && <Loader size="big" />}
              <Paragraph secondary>You need to <Link onClick={() => profileActions.connect()}>sign in</Link> before to submit an event</Paragraph>
            </Grid.Column>
          </Grid.Row>
        </Grid>}
        {profile && <Grid stackable>
          <Grid.Row>
            <Grid.Column style={{ width: '58px', paddingRight: '8px' }}>
              <BackButton to="/" style={{ margin: '5px 3px' }} />
            </Grid.Column>
            <Grid.Column mobile="15">
              <Title style={{ fontSize: '34px', lineHeight: '42px' }}>Submit event</Title>
              <Paragraph secondary>Text explaining some stuff about this screen. Might get long, lets hope not.</Paragraph>
              <Grid stackable style={{ paddingTop: '48px' }}>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field style={{ width: '100%' }} name="name" error={!!errors['name']} message={errors['name']} label="Event Name" placeholder="Awesome event name" defaultValue={event.name} onChange={handleValueChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Description" name="description" error={!!errors['description']} message={errors['description']} placeholder="A short description of the event" defaultValue={event.description} onChange={handleValueChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field label="Start date" name="start_date" type="date" error={!!errors['start_date']} message={errors['start_date']} value={toInputDate(event.start_at)} min={toInputDate(new Date())} onChange={handleChangeStartDate} />
                  </Grid.Column>
                  <Grid.Column mobile="4">
                    <Field label="Start time" name="start_time" type="time" error={!!errors['start_time']} message={errors['start_time']} value={toInputTime(event.start_at)} onChange={handleChangeStartTime} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field label="End date" name="finish_date" type="date" error={!!errors['finish_date']} message={errors['finish_date']} value={toInputDate(event.finish_at)} min={toInputDate(event.start_at)} onChange={handleChangeFinishDate} />
                  </Grid.Column>
                  <Grid.Column mobile="4">
                    <Field label="End time" name="finish_time" type="time" error={!!errors['finish_time']} message={errors['finish_time']} value={toInputTime(event.finish_at)} onChange={handleChangeFinishTime} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="4">
                    <Field label="Coordinates" name="coordinates" error={!!errors['coordinates']} message={errors['coordinates']} defaultValue={event.coordinates.join(',')} onChange={handleChangeCoordinates} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Contact info (email o discord)" name="contact" error={!!errors['contact']} message={errors['contact']} placeholder="hello@decentraland.org" defaultValue={event.name} onChange={handleValueChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Field label="Anything else you want to tell us?" name="details" error={!!errors['details']} message={errors['details']} placeholder="Add useful information for our reviewers" defaultValue={event.name} onChange={handleValueChange} />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column mobile="8">
                    <Button primary loading={creating === Status.Creating} disabled={creating === Status.Created} style={{ width: '212px' }} onClick={handleSubmit}>SUBMIT</Button>
                  </Grid.Column>
                </Grid.Row>
                {errors['general'] && <Grid.Row>
                  <Grid.Column mobile="8">
                    <Paragraph style={{ color: '#ff0000' }}>{errors['general']}</Paragraph>
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
