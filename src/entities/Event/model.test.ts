import { EventListOptions, EventListType } from "./types"
import EventModel from "./model"

// We need to test the private method indirectly through getEvents,
// but for unit testing the filter conditions, we'll test via a mock approach
// that extracts and validates the SQL conditions

describe("EventModel.buildEventFilterConditions", () => {
  // Access the private method for testing
  const buildEventFilterConditions = (
    EventModel as any
  ).buildEventFilterConditions.bind(EventModel)

  describe("only_attendee filter", () => {
    it("should include attendee filter when only_attendee is true and user is set", () => {
      const options: Partial<EventListOptions> = {
        user: "0xmyaddress",
        only_attendee: true,
        list: EventListType.Active,
      }

      const conditions = buildEventFilterConditions(options)
      const conditionTexts = conditions.map((c: any) => c.text)

      // Should include the attendee filter
      const hasAttendeeFilter = conditionTexts.some(
        (text: string) =>
          text.includes("a.user IS NOT NULL") ||
          text.includes("a.user is not null")
      )

      expect(hasAttendeeFilter).toBe(true)
    })

    it("should NOT include attendee filter when only_attendee is false", () => {
      const options: Partial<EventListOptions> = {
        user: "0xmyaddress",
        only_attendee: false,
        list: EventListType.Active,
      }

      const conditions = buildEventFilterConditions(options)
      const conditionTexts = conditions.map((c: any) => c.text)

      const hasAttendeeFilter = conditionTexts.some(
        (text: string) =>
          text.includes("a.user IS NOT NULL") ||
          text.includes("a.user is not null")
      )

      expect(hasAttendeeFilter).toBe(false)
    })

    it("should NOT include attendee filter when only_attendee is true but user is not set", () => {
      const options: Partial<EventListOptions> = {
        only_attendee: true,
        list: EventListType.Active,
      }

      const conditions = buildEventFilterConditions(options)
      const conditionTexts = conditions.map((c: any) => c.text)

      const hasAttendeeFilter = conditionTexts.some(
        (text: string) =>
          text.includes("a.user IS NOT NULL") ||
          text.includes("a.user is not null")
      )

      expect(hasAttendeeFilter).toBe(false)
    })

    it("should NOT include attendee filter when neither only_attendee nor user is set", () => {
      const options: Partial<EventListOptions> = {
        list: EventListType.Active,
      }

      const conditions = buildEventFilterConditions(options)
      const conditionTexts = conditions.map((c: any) => c.text)

      const hasAttendeeFilter = conditionTexts.some(
        (text: string) =>
          text.includes("a.user IS NOT NULL") ||
          text.includes("a.user is not null")
      )

      expect(hasAttendeeFilter).toBe(false)
    })
  })
})
