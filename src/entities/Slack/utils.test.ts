import { notifyNewEvent } from "./utils"
import { DeprecatedEventAttributes } from "../Event/types"

jest.mock("decentraland-gatsby/dist/utils/env", () => {
  return (key: string, fallback?: string) => {
    if (key === "SLACK_WEBHOOK") return "https://hooks.slack.com/services/T/B/X"
    if (key === "BASE_URL") return "https://decentraland.org"
    if (key === "JUMP_IN_SITE_URL") return "https://decentraland.org/jump"
    return fallback ?? ""
  }
})

const event = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Test Event",
  description: "desc",
  image: "https://example.com/image.png",
  user_name: "TestUser",
  url: "https://decentraland.org/jump?position=0,0",
  scene_name: "Decentraland",
  estate_name: null,
  coordinates: [0, 0],
} as unknown as DeprecatedEventAttributes

describe("notifyNewEvent", () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      text: async () => "ok",
    })
    ;(global as { fetch: unknown }).fetch = fetchMock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("links the Slack message to the admin pending-events review modal", async () => {
    await notifyNewEvent(event)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    const blob = JSON.stringify(body)

    expect(blob).toContain(
      `https://decentraland.org/whats-on/admin/pending-events?id=${event.id}`
    )
    expect(blob).not.toContain("/whats-on/edit-hangout/")
  })
})
