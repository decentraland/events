
import React, { useEffect, useMemo, useState } from "react"
import { Address } from 'web3x/address'
import { Personal } from 'web3x/personal'

import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"
import { SignIn } from "decentraland-ui/dist/components/SignIn/SignIn"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { SelectField } from "decentraland-ui/dist/components/SelectField/SelectField"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Table } from "decentraland-ui/dist/components/Table/Table"
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import { Stats } from 'decentraland-ui/dist/components/Stats/Stats'
import Accordion from "../components/Doc/Accordion"

import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Code from "decentraland-gatsby/dist/components/Text/Code"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import Navigation from "../components/Layout/Navigation"
import { useEventsContext, useEventSorter } from "../context/Event"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import './index.css'

export type IndexPageState = {
  updating: Record<string, boolean>
}

type AttendState = {
  processing: boolean,
  event: null | string,
  attend: null | boolean,
  address: null | string,
  message: null | string,
  signature: null | string,
}

const attendOptions = [
  { key: 'yes', value: true, text: 'yes' },
  { key: 'no', value: false, text: 'no' },
]

export default function IndexPage(props: any) {
  const [ account, accountState ] = useAuthContext()
  const [ events, eventsState ] = useEventsContext()
  const sortedEvents = useEventSorter(events)
  const [ attendState, setAttendState ] = useState<AttendState>({
    processing: false,
    event: null,
    attend: null,
    address: null,
    message: null,
    signature: null
  })

  const eventOptions = useMemo(() => {
    return sortedEvents
      .filter(event => event.approved)
      .map(event => ({ key: event.id, value: event.id, text: event.name, image: event.image }))
  }, [ sortedEvents ])

  useEffect(() => {
    if (attendState.processing) {
      if (!attendState.event || !accountState.provider || !account) {
        setAttendState((current) => ({ ...current, processing: false }))
      } else {
        const message = JSON.stringify({
          type: 'attend',
          timestamp: new Date,
          event: attendState.event,
          attend: attendState.attend ?? true,
        })
        new Personal(accountState.provider)
          .sign(
            message,
            Address.fromString(account),
            ''
          )
          .then((signature) => {
            console.log(signature)
            setAttendState((current) => ({ ...current, address: account, message, signature, processing: false }))
          })
          .catch((err) => {
            console.error(err)
            setAttendState((current) => ({ ...current, processing: false }))
          })
      }
    }
  }, [ attendState.processing, accountState.provider, account ])

  if (!account) {
    return <>
      <Navigation />
      <Container className="SettingsPage">
        <SignIn />
      </Container>
    </>
  }

  return (<>
      <Navigation />
      <Container>
        <Card style={{width: '100%'}}>
          <Card.Content>
            <Accordion
              id="api-events"
              title={<Stats title="get">/api/events</Stats>}
              description={<Paragraph secondary small>Returns the list of the upcoming events</Paragraph>}
            />
          </Card.Content>
        </Card>
        <Card style={{width: '100%'}}>
          <Card.Content>
            <Accordion
              id="api-events"
              title={<Stats title="get">/api/events/:event_id</Stats>}
              description={<Paragraph secondary small>Returns information about an event by ID</Paragraph>}
            />
          </Card.Content>
        </Card>
        <Card style={{width: '100%'}}>
          <Card.Content>
            <Accordion
              id="api-events"
              title={<Stats title="get">/api/events/:event_id/attendees</Stats>}
              description={<Paragraph secondary small>Returns the list of addresses register for attending an event by ID</Paragraph>}
            />
          </Card.Content>
        </Card>
        <Card style={{width: '100%'}}>
          <Card.Content>
            <Accordion
              id="api-message"
              title={<Stats title="post">/api/message</Stats>}
              description={<Paragraph secondary small>Apply an action in name of a user using their sign</Paragraph>}
            >
              <Divider size="tiny" />
              <SubTitle>Request</SubTitle>
              <Table basic="very">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>name</Table.HeaderCell>
                    <Table.HeaderCell>type</Table.HeaderCell>
                    <Table.HeaderCell>place</Table.HeaderCell>
                    <Table.HeaderCell>description</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell><Code inline>address</Code></Table.Cell>
                    <Table.Cell><Code inline>string</Code></Table.Cell>
                    <Table.Cell><Code inline>body</Code></Table.Cell>
                    <Table.Cell>user wallet</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Code inline>message</Code></Table.Cell>
                    <Table.Cell><Code inline>string</Code></Table.Cell>
                    <Table.Cell><Code inline>body</Code></Table.Cell>
                    <Table.Cell>action to execute</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Code inline>signature</Code></Table.Cell>
                    <Table.Cell><Code inline>string</Code></Table.Cell>
                    <Table.Cell><Code inline>body</Code></Table.Cell>
                    <Table.Cell>message signed by the user address</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
              <Code note="request body" language="json">
                {JSON.stringify({
                  address: "0x0000000000000000000000000000000000000000",
                  message: '{"type":"message", ... }',
                  signature: '0x00000...00000'
                }, null, 4)}
              </Code>
              <Divider size="tiny" />
              <SubTitle>Response</SubTitle>
              <Table basic="very">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>name</Table.HeaderCell>
                    <Table.HeaderCell>type</Table.HeaderCell>
                    <Table.HeaderCell>place</Table.HeaderCell>
                    <Table.HeaderCell>description</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell><Code inline>ok</Code></Table.Cell>
                    <Table.Cell><Code inline>boolean</Code></Table.Cell>
                    <Table.Cell><Code inline>response</Code></Table.Cell>
                    <Table.Cell></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Code inline>data</Code></Table.Cell>
                    <Table.Cell><Code inline>any</Code></Table.Cell>
                    <Table.Cell><Code inline>response</Code></Table.Cell>
                    <Table.Cell>depends on the message type</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
              <Code note="response body" language="json">
                {JSON.stringify({
                  ok: true,
                  data: true
                }, null, 4)}
              </Code>
            </Accordion>
          </Card.Content>
        </Card>
        <Card style={{width: '100%'}}>
          <Card.Content>
            <Accordion
              id="api-message-attend"
              title={<Stats title="post">/api/message (type: attend)</Stats>}
              description={<Paragraph secondary small>Register/Unregister an attend to an event</Paragraph>}
            >
            <Divider size="tiny" />
            <SubTitle>Message</SubTitle>
            <Table basic="very">
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>name</Table.HeaderCell>
                  <Table.HeaderCell>type</Table.HeaderCell>
                  <Table.HeaderCell>place</Table.HeaderCell>
                  <Table.HeaderCell>description</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell><Code inline>type</Code></Table.Cell>
                  <Table.Cell><Code inline>"attend"</Code></Table.Cell>
                  <Table.Cell><Code inline>message</Code></Table.Cell>
                  <Table.Cell></Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell><Code inline>timestamp</Code></Table.Cell>
                  <Table.Cell><Code inline>string (format: date)</Code></Table.Cell>
                  <Table.Cell><Code inline>message</Code></Table.Cell>
                  <Table.Cell>the time at which the sign was request, <br />message are only valid for 10 minutes after this timestamp</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell><Code inline>event</Code></Table.Cell>
                  <Table.Cell><Code inline>string (format: uuid)</Code></Table.Cell>
                  <Table.Cell><Code inline>message</Code></Table.Cell>
                  <Table.Cell>event id</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell><Code inline>attend</Code></Table.Cell>
                  <Table.Cell><Code inline>boolean (default: true)</Code></Table.Cell>
                  <Table.Cell><Code inline>message</Code></Table.Cell>
                  <Table.Cell>if is <Code inline>true</Code> an attend will be register if is <Code inline>false</Code> the attend will be removed.</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
            <Code note="request body" language="json">
              {JSON.stringify({
                type: 'attend',
                timestamp: new Date().toJSON(),
                event: '00000000-0000-0000-0000-000000000000',
                attend: true
              }, null, 4)}
            </Code>

            <Divider size="tiny" />
            <SubTitle>Generate</SubTitle>
            <Grid stackable>
              <Grid.Row>
                <Grid.Column tablet="6">
                  <SelectField label="event" options={eventOptions} placeholder="Select an event" onChange={(_, { value }) => setAttendState((current) => ({ ...current, event: value as any }))} />
                </Grid.Column>
                <Grid.Column tablet="4">
                  <SelectField label="attend" options={attendOptions} placeholder="Are you attending?" onChange={(_, { value }) => setAttendState((current) => ({ ...current, attend: value as any }))} />
                </Grid.Column>
                <Grid.Column tablet="4">
                  <Button primary onClick={() => setAttendState((current) => ({ ...current, processing: true }))} style={{ marginTop: '20px' }} loading={attendState.processing} disabled={!account || attendState.attend === null || attendState.event === null}>
                    SIGN MESSAGE
                  </Button>
                </Grid.Column>
              </Grid.Row>
            </Grid>
            <Code note="message" language="json">
              {JSON.stringify({ type: 'attend', timestamp:  new Date, event: attendState.event, attend: attendState.attend }, null, 4)}
            </Code>
            <Code note="body" language="json">
              {JSON.stringify({ address: attendState.address, message: attendState.message, signature: attendState.signature }, null, 4)}
            </Code>
            <Code note="request" language="curl">
              {[
                `curl --request POST \\`,
                `    --header "Content-Type: application/json" \\`,
                `    --data '${attendState.address &&   JSON.stringify({ address: attendState.address, message: attendState.message, signature: attendState.signature })}' \\`,
                `    ${process.env.GATSBY_EVENTS_URL}/message`,
                ``,
                ``,
              ].join(`\n`)}
            </Code>
              <Divider size="tiny" />
              <SubTitle>Response</SubTitle>
              <Table basic="very">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>name</Table.HeaderCell>
                    <Table.HeaderCell>type</Table.HeaderCell>
                    <Table.HeaderCell>place</Table.HeaderCell>
                    <Table.HeaderCell>description</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell><Code inline>ok</Code></Table.Cell>
                    <Table.Cell><Code inline>boolean</Code></Table.Cell>
                    <Table.Cell><Code inline>response</Code></Table.Cell>
                    <Table.Cell></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Code inline>data</Code></Table.Cell>
                    <Table.Cell><Code inline>boolean</Code></Table.Cell>
                    <Table.Cell><Code inline>response</Code></Table.Cell>
                    <Table.Cell><Code inline>true</Code> if attend was created and <Code inline>false</Code> if attend was deleted</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
              <Code note="response body" language="json">
                {JSON.stringify({
                  ok: true,
                  data: true
                }, null, 4)}
              </Code>
            </Accordion>
          </Card.Content>
        </Card>
      </Container>
    </>)
}
