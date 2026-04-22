import JobContext from "decentraland-gatsby/dist/entities/Job/context"

import { updateNextStartAt } from "./cron"
import EventModel from "./model"
import { Frequency } from "./types"

jest.mock("./model")

function makeEvent(overrides: Record<string, unknown> = {}) {
  const startAt = new Date()
  return {
    id: "00000000-0000-0000-0000-000000000001",
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
