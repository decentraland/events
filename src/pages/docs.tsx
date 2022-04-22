import React from "react"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import ApiCard from "decentraland-gatsby/dist/components/Docs/ApiCard"
import ApiDetails from "decentraland-gatsby/dist/components/Docs/ApiDetails"
import Navigation from "../components/Layout/Navigation"
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
            body={eventAttendeeListScheme}
          />
        </ApiCard>
        <ApiCard
          id="get-attendees"
          method="POST"
          path="/api/events/{event_id}/attendees"
          description="Create an intention to attend ot a event"
        >
          <ApiDetails
            title="Request"
            cors="*"
            authorization
            params={getEventParamsSchema}
          />
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
          <ApiDetails
            title="Request"
            cors="*"
            authorization
            params={getEventParamsSchema}
          />
          <ApiDetails
            title="Response"
            cors="*"
            body={eventAttendeeListScheme}
          />
        </ApiCard>
      </Container>
    </>
  )
}
