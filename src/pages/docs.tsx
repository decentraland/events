import React from "react"

import ApiCard from "decentraland-gatsby/dist/components/Docs/ApiCard"
import ApiDetails from "decentraland-gatsby/dist/components/Docs/ApiDetails"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import Navigation from "../components/Layout/Navigation"
import {
  eventListResponseSchema,
  eventResponseSchema,
  getEventListQuery,
  getEventParamsSchema,
} from "../entities/Event/schemas"
import { eventAttendeeListScheme } from "../entities/EventAttendee/schemas"
import { eventCategoryListScheme } from "../entities/EventCategory/schema"
import {
  getScheduleSchema,
  scheduleListScheme,
  scheduleScheme,
} from "../entities/Schedule/schema"

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

        <ApiCard
          id="get-categories"
          method="GET"
          path="/api/events/categories"
          description="Return all the categories of events"
        >
          <ApiDetails title="Request" cors="*" />
          <ApiDetails
            title="Response"
            cors="*"
            body={eventCategoryListScheme}
          />
        </ApiCard>

        <ApiCard
          id="get-schedules"
          method="GET"
          path="/api/schedules"
          description="Return all the schedules"
        >
          <ApiDetails title="Request" cors="*" />
          <ApiDetails title="Response" cors="*" body={scheduleListScheme} />
        </ApiCard>

        <ApiCard
          id="get-schedule"
          method="GET"
          path="/api/schedules/{schedule_id}"
          description="Return information of a schedule by ID"
        >
          <ApiDetails title="Request" cors="*" />
          <ApiDetails title="Response" cors="*" body={scheduleScheme} />
        </ApiCard>

        <ApiCard
          id="post-schedule"
          method="POST"
          path="/api/schedules"
          description="Create a schedule"
        >
          <ApiDetails
            title="Request"
            cors="*"
            authorization
            params={getScheduleSchema}
          />
          <ApiDetails title="Response" cors="*" params={scheduleScheme} />
        </ApiCard>

        <ApiCard
          id="patch-schedule"
          method="PATCH"
          path="/api/schedules"
          description="Edit a schedule"
        >
          <ApiDetails
            title="Request"
            cors="*"
            authorization
            params={getScheduleSchema}
          />
          <ApiDetails title="Response" cors="*" params={scheduleScheme} />
        </ApiCard>

        <ApiCard
          id="delete-schedule"
          method="DELETE"
          path="/api/schedules/{schedule_id}"
          description="Delete a schedule"
        >
          <ApiDetails
            title="Request"
            cors="*"
            authorization
            params={getScheduleSchema}
          />
          <ApiDetails title="Response" cors="*" params={scheduleScheme} />
        </ApiCard>
      </Container>
    </>
  )
}
