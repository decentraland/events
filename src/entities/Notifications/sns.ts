import { PublishBatchCommand, SNSClient } from "@aws-sdk/client-sns"
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  EventCreatedEvent,
  EventStartedEvent,
  EventStartsSoonEvent,
} from "@dcl/schemas"
import env from "decentraland-gatsby/dist/utils/env"

type PublishableEvent =
  | EventCreatedEvent
  | EventStartedEvent
  | EventStartsSoonEvent

function chunk<T>(theArray: T[], size: number): T[][] {
  return theArray.reduce((acc: T[][], _, i) => {
    if (i % size === 0) {
      acc.push(theArray.slice(i, i + size))
    }
    return acc
  }, [])
}

const MAX_BATCH_SIZE = 10
const snsArn = env("AWS_SNS_ARN")
const optionalEndpoint = env("AWS_SNS_ENDPOINT", "")
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 500

export function createSnsPublisher() {
  if (!snsArn) {
    throw new Error("Missing required env var AWS_SNS_ARN")
  }

  const client = new SNSClient({
    endpoint: optionalEndpoint ? optionalEndpoint : undefined,
  })

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function publishBatch(
    batch: PublishableEvent[],
    batchIndex: number,
    attempt: number
  ): Promise<{
    successfulMessageIds: string[]
    failedEvents: PublishableEvent[]
  }> {
    const entries = batch.map((event, index) => {
      return {
        Id: `msg_${attempt}_${batchIndex * MAX_BATCH_SIZE + index}`,
        Message: JSON.stringify(event),
        MessageAttributes: {
          type: {
            DataType: "String",
            StringValue: (event as any).type || "unknown",
          },
          subType: {
            DataType: "String",
            StringValue: (event as any).subType || "unknown",
          },
        },
      }
    })

    const command = new PublishBatchCommand({
      TopicArn: snsArn,
      PublishBatchRequestEntries: entries,
    })

    const { Successful, Failed } = await client.send(command)

    const successfulMessageIds: string[] =
      Successful?.map((result) => result.MessageId).filter(
        (messageId): messageId is string => typeof messageId === "string"
      ) || []

    const failedEventsForBatch =
      Failed?.map((failure) => {
        const failedEntry = entries.find((entry) => entry.Id === failure.Id)
        const failedIndex = failedEntry ? entries.indexOf(failedEntry) : -1
        return failedIndex >= 0 ? batch[failedIndex] : undefined
      }).filter((x): x is PublishableEvent => Boolean(x)) || []

    return { successfulMessageIds, failedEvents: failedEventsForBatch }
  }

  async function publishMessages(events: Array<PublishableEvent>): Promise<{
    successfulMessageIds: string[]
    failedEvents: PublishableEvent[]
  }> {
    let pendingEvents = [...events]
    const allSuccessfulIds: string[] = []
    let attempt = 0

    while (pendingEvents.length > 0 && attempt <= MAX_RETRIES) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt)
      }

      const batches = chunk(pendingEvents, MAX_BATCH_SIZE)

      const results = await Promise.all(
        batches.map((batch, batchIndex) =>
          publishBatch(batch, batchIndex, attempt)
        )
      )

      // Collect all successful IDs
      allSuccessfulIds.push(...results.flatMap((r) => r.successfulMessageIds))

      // Prepare next retry set from failures
      pendingEvents = results.flatMap((r) => r.failedEvents)
      attempt++
    }

    return {
      successfulMessageIds: allSuccessfulIds,
      failedEvents: pendingEvents,
    }
  }

  return { publishMessages }
}

