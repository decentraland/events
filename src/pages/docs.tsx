import React, { useEffect, useMemo, useState } from "react"
import { Address } from "web3x/address"
import { Personal } from "web3x/personal"

import Grid from "semantic-ui-react/dist/commonjs/collections/Grid/Grid"
import { Container } from "decentraland-ui/dist/components/Container/Container"
import { SelectField } from "decentraland-ui/dist/components/SelectField/SelectField"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { Table } from "decentraland-ui/dist/components/Table/Table"

import ApiCard from "decentraland-gatsby/dist/components/Docs/ApiCard"
import ApiDetails from "decentraland-gatsby/dist/components/Docs/ApiDetails"
import Code from "decentraland-gatsby/dist/components/Text/Code"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import Navigation from "../components/Layout/Navigation"
import { useEventsContext, useEventSorter } from "../context/Event"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import {
  getEventListQuery,
  eventResponseSchema,
  eventListResponseSchema,
  getEventParamsSchema,
} from "../entities/Event/schemas"
import { eventAttendeeListScheme } from "../entities/EventAttendee/schemas"
import "./index.css"

export type IndexPageState = {
  updating: Record<string, boolean>
}

type AttendState = {
  processing: boolean
  event: null | string
  attend: null | boolean
  address: null | string
  message: null | string
  signature: null | string
}

const attendOptions = [
  { key: "yes", value: true, text: "yes" },
  { key: "no", value: false, text: "no" },
]

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <Container>
        <ApiCard
          id="get-events"
          method="GET"
          path="/api/events"
          description="Returns the list of the upcoming events"
        >
          <ApiDetails title="Request" cors="*" query={getEventListQuery} />

          <ApiDetails title="Response" body={eventListResponseSchema} />
        </ApiCard>

        <ApiCard
          id="get-event"
          method="GET"
          path="/api/events/{event_id}"
          description="Returns information about an event by ID"
        >
          <ApiDetails title="Request" cors="*" params={getEventParamsSchema} />

          <ApiDetails title="Response" body={eventResponseSchema} />
        </ApiCard>
        <ApiCard
          id="get-attendees"
          method="GET"
          path="/api/events/{event_id}/attendees"
          description="Returns the list of addresses register for attending an event by ID"
        >
          <ApiDetails title="Request" cors="*" params={getEventParamsSchema} />
          <ApiDetails
            title="Response"
            cors="*"
            params={eventAttendeeListScheme}
          />
        </ApiCard>
        <ApiCard
          id="get-attendees"
          method="POST"
          path="/api/events/{event_id}/attendees"
          description="Create an intention to attend ot a event"
        >
          <ApiDetails title="Request" cors="*" authorization params={getEventParamsSchema} />
          <ApiDetails
            title="Response"
            cors="*"
            params={eventAttendeeListScheme}
          />
        </ApiCard>
        <ApiCard
          id="get-attendees"
          method="DELETE"
          path="/api/events/{event_id}/attendees"
          description="Remove your intention to attend ot a event"
        >
          <ApiDetails title="Request" cors="*" authorization params={getEventParamsSchema} />
          <ApiDetails
            title="Response"
            cors="*"
            params={eventAttendeeListScheme}
          />
        </ApiCard>
      </Container>
    </>
  )
}
