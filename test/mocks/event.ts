import { randomUUID } from "crypto"

import EventModel from "../../src/entities/Event/model"
import {
  DeprecatedEventAttributes,
  EventAttributes,
} from "../../src/entities/Event/types"

export async function seedEvent(
  overrides: Partial<EventAttributes> = {}
): Promise<DeprecatedEventAttributes> {
  const startAt = new Date("2030-01-01T00:00:00Z")
  const event = {
    id: randomUUID(),
    name: "Test Event",
    image: "https://example.com/image.png",
    image_vertical: null,
    description: "Test description",
    start_at: startAt,
    finish_at: new Date("2030-01-01T01:00:00Z"),
    next_start_at: startAt,
    next_finish_at: new Date("2030-01-01T01:00:00Z"),
    duration: 3600000,
    all_day: false,
    x: 0,
    y: 0,
    server: null,
    url: "https://decentraland.org/jump?position=0,0",
    user: "0x0000000000000000000000000000000000000000",
    estate_id: null,
    estate_name: null,
    user_name: "TestUser",
    approved: true,
    rejected: false,
    highlighted: false,
    trending: false,
    created_at: new Date(),
    updated_at: new Date(),
    recurrent: false,
    recurrent_frequency: null,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_interval: 1,
    recurrent_count: null,
    recurrent_until: null,
    recurrent_dates: [startAt],
    contact: null,
    details: null,
    total_attendees: 0,
    latest_attendees: [],
    textsearch: null,
    categories: [],
    schedules: [],
    approved_by: null,
    rejected_by: null,
    world: false,
    place_id: null,
    community_id: null,
    scene_name: null,
    coordinates: [0, 0] as [number, number],
    ...overrides,
  } satisfies DeprecatedEventAttributes

  await EventModel.create(event)
  return event
}
