import JobContext from "decentraland-gatsby/dist/entities/Job/context"

import { updateNextStartAt } from "./cron"
import EventModel from "./model"
import { DeprecatedEventAttributes, Frequency } from "./types"

jest.mock("./model")

function makeEvent(
  overrides: Partial<DeprecatedEventAttributes> = {}
): DeprecatedEventAttributes {
  const startAt = new Date()
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Recurring event",
    image: null,
    image_vertical: null,
    description: "",
    all_day: false,
    x: 0,
    y: 0,
    server: null,
    url: "https://example.org/event",
    user: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    estate_id: null,
    estate_name: null,
    user_name: null,
    approved: true,
    rejected: false,
    highlighted: false,
    trending: false,
    created_at: startAt,
    updated_at: startAt,
    contact: null,
    details: null,
    total_attendees: 0,
    latest_attendees: [],
    textsearch: null,
    categories: [],
    schedules: [],
    approved_by: null,
    rejected_by: null,
    rejection_reason: null,
    deleted_by_user: false,
    deleted_by_admin: false,
    deleted_by: null,
    deleted_at: null,
    deleted_reason: null,
    world: false,
    place_id: null,
    community_id: null,
    featured_item: null,
    scene_name: null,
    coordinates: [0, 0],
    start_at: startAt,
    finish_at: new Date(startAt.getTime() + 60 * 60 * 1000),
    duration: 60 * 60 * 1000,
    recurrent: true,
    recurrent_interval: 1,
    recurrent_frequency: Frequency.DAILY,
    recurrent_count: null,
    recurrent_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    recurrent_weekday_mask: 0,
    recurrent_month_mask: 0,
    recurrent_setpos: null,
    recurrent_monthday: null,
    recurrent_dates: [startAt],
    next_start_at: startAt,
    next_finish_at: new Date(startAt.getTime() + 60 * 60 * 1000),
    ...overrides,
  }
}

function makeCtx(): JobContext<{}> {
  return { log: jest.fn() } as unknown as JobContext<{}>
}

describe("updateNextStartAt", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("when the event's recurrence would exceed the past-iteration cap", () => {
    // HOURLY + start_at 10 years ago = ~88k iterations, over the 50k cap.
    const tenYearsAgo = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)

    it("should skip the event without calling EventModel.update", async () => {
      const pathological = makeEvent({
        start_at: tenYearsAgo,
        recurrent_frequency: Frequency.HOURLY,
      })
      ;(EventModel.getRecurrentFinishedEvents as jest.Mock).mockResolvedValue([
        pathological,
      ])

      await updateNextStartAt(makeCtx())

      expect(EventModel.update).not.toHaveBeenCalled()
    })
  })

  describe("when the event's recurrence is within the cap", () => {
    it("should update the event", async () => {
      const event = makeEvent()
      ;(EventModel.getRecurrentFinishedEvents as jest.Mock).mockResolvedValue([
        event,
      ])

      await updateNextStartAt(makeCtx())

      expect(EventModel.update).toHaveBeenCalled()
    })
  })

  describe("when there is a mix of pathological and healthy events", () => {
    it("should skip only the pathological one and still update the healthy one", async () => {
      const tenYearsAgo = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
      const pathological = makeEvent({
        id: "00000000-0000-0000-0000-000000000bad",
        start_at: tenYearsAgo,
        recurrent_frequency: Frequency.HOURLY,
      })
      const healthy = makeEvent({
        id: "00000000-0000-0000-0000-0000000000ad",
      })
      ;(EventModel.getRecurrentFinishedEvents as jest.Mock).mockResolvedValue([
        pathological,
        healthy,
      ])

      await updateNextStartAt(makeCtx())

      expect(EventModel.update).toHaveBeenCalledTimes(1)
      expect(EventModel.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ id: healthy.id })
      )
    })
  })
})

describe("when recurrence persistence is still pending", () => {
  let finishWrite: (value: {}) => void
  let pendingWrite: Promise<{}>
  let job: Promise<void>
  let completed: boolean

  beforeEach(async () => {
    pendingWrite = new Promise<{}>((resolve) => {
      finishWrite = resolve
    })
    completed = false
    jest
      .mocked(EventModel.getRecurrentFinishedEvents)
      .mockResolvedValueOnce([
        makeEvent(),
        makeEvent({ id: "00000000-0000-0000-0000-000000000002" }),
      ])
    jest
      .mocked(EventModel.update)
      .mockReturnValueOnce(pendingWrite)
      .mockResolvedValueOnce({})
    job = updateNextStartAt(makeCtx()).then(() => {
      completed = true
    })
    await Promise.resolve()
    await Promise.resolve()
  })

  afterEach(async () => {
    finishWrite({})
    await job
    jest.resetAllMocks()
  })

  it("should keep the job pending until the database write finishes", () => {
    expect(completed).toBe(false)
  })

  it("should wait before starting the next event update", () => {
    expect(EventModel.update).toHaveBeenCalledTimes(1)
  })
})

describe("when recurrence persistence fails", () => {
  let failure: Error

  beforeEach(() => {
    failure = new Error("database write failed")
    jest
      .mocked(EventModel.getRecurrentFinishedEvents)
      .mockResolvedValueOnce([
        makeEvent(),
        makeEvent({ id: "00000000-0000-0000-0000-000000000002" }),
      ])
    jest.mocked(EventModel.update).mockRejectedValueOnce(failure)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should reject the job so the scheduler observes the failure", async () => {
    await expect(updateNextStartAt(makeCtx())).rejects.toBe(failure)
    expect(EventModel.update).toHaveBeenCalledTimes(1)
  })
})
