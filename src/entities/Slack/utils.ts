import logger from "decentraland-gatsby/dist/entities/Development/logger"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { Avatar } from "decentraland-gatsby/dist/utils/api/Catalyst"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"
import { escape } from "html-escaper"
import fetch from "isomorphic-fetch"
import isURL from "validator/lib/isURL"

import en from "../../intl/en.json"
import { DeprecatedEventAttributes } from "../Event/types"
import { eventUrl } from "../Event/utils"
import { ProfileSettingsAttributes } from "../ProfileSettings/types"

const SLACK_WEBHOOK = env("SLACK_WEBHOOK", "")
const DECENTRALAND_URL = env(
  "DECENTRALAND_URL",
  "https://play.decentraland.org"
)

if (!isURL(SLACK_WEBHOOK)) {
  logger.log(`missing config SLACK_WEBHOOK`)
}

export async function notifyNewEvent(event: DeprecatedEventAttributes) {
  logger.log(`sending new event "${event.id}" to slack`)
  await sendToSlack({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:tada: New event submitted: <${eventUrl(event)}|${event.id}>`,
        },
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text: [
            `${event.name} by ${event.user_name || "Guest"}`,
            event.description || "No description",
          ].join("\n\n"),
        },
        accessory: {
          type: "image",
          image_url: event.image,
          alt_text: event.scene_name || "Decentraland",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `at <${eventUrl(event)}|Events page>`,
            event.url &&
              event.url.startsWith(DECENTRALAND_URL) &&
              `at <${event.url}|${
                event.estate_name || event.scene_name || "Decentraland"
              } (${event.coordinates.join(",")})>`,
            (!event.url || !event.url.startsWith(DECENTRALAND_URL)) &&
              `at ${event.url}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
  })
}

export async function notifyApprovedEvent(event: DeprecatedEventAttributes) {
  logger.log(`sending approved event "${event.id}" to slack`)
  const selfApproved = event.user === event.approved_by ? "(him/her self)" : ""
  await sendToSlack({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:white_check_mark: new event approved: *<${eventUrl(event)}|${
            event.id
          }>*`,
        },
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text: event.name,
        },
      },
      event.approved_by && {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\n_by:_ \`${event.approved_by}\` _${selfApproved}_`,
        },
      },
    ].filter(Boolean),
  })
}

export async function notifyRejectedEvent(event: DeprecatedEventAttributes) {
  logger.log(`sending rejected event "${event.id}" to slack`)
  const selfRejected = event.user === event.rejected_by ? "(him/her self)" : ""
  await sendToSlack({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:x: new event rejected: *<${eventUrl(event)}|${event.id}>*`,
        },
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text: event.name,
        },
      },
      event.approved_by && {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\n_by:_ \`${event.approved_by}\` _${selfRejected}_`,
        },
      },
    ].filter(Boolean),
  })
}

const latestEditNotification = new Map<string, number>()
export async function notifyEditedEvent(event: DeprecatedEventAttributes) {
  const now = Date.now()
  const latestNotification = latestEditNotification.get(event.id) || 0
  if (now - latestNotification < Time.Minute) {
    return
  }

  logger.log(`sending edited event "${event.id}" to slack`)
  latestEditNotification.set(event.id, now)
  await sendToSlack({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:pencil2: user ${
            event.user_name || "Guest"
          } just edited his event: *<${eventUrl(event)}|${event.id}>*`,
        },
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text: event.name,
        },
      },
    ],
  })
}

export async function notifyUpcomingEvent(
  event: DeprecatedEventAttributes,
  emailNotifications: number,
  pushNotifications: number
) {
  logger.log(`sending upcoming event "${event.id}" to slack`)
  await sendToSlack({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:runner: *<${eventUrl(event)}|${
            event.name
          }>* is about to start (sent: ${emailNotifications} :email:, ${pushNotifications} :bell:)`,
        },
      },
    ],
  })
}

const SEND_CLOUD_DOWN = 1000 * 60 * 5
let NEXT_ERROR_AT = 0
export async function notifyEventError(user: Avatar, error: RequestError) {
  if (Date.now() > NEXT_ERROR_AT) {
    NEXT_ERROR_AT = Date.now() + SEND_CLOUD_DOWN
    logger.log(`sending error to slack`)
    const userName = user.name || "Guest"
    const userContact = user.email
      ? `<mailto:${user.email}|${userName} [${user.ethAddress}]>`
      : `${userName} [${user.ethAddress}]`
    const errorDetails =
      "```" +
      JSON.stringify(
        {
          message: error.message,
          statusCode: error.statusCode,
          data: error.data || null,
        },
        null,
        2
      ) +
      "```"
    await sendToSlack({
      // :x:
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:x: An error occurred while creating an event (user: ${userContact})\n\n${errorDetails}`,
          },
        },
      ],
    })
  }
}

async function sendToSlack(body: {}) {
  if (!isURL(SLACK_WEBHOOK)) {
    return
  }

  try {
    const response = await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.text()

    if (response.status >= 400) {
      logger.error(`Slack bad request: ${data} (${response.status})`)
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Slack service error: ` + error.message, error)
    }
  }
}

export async function notifyProfileSettingUpdate(
  profile: ProfileSettingsAttributes
) {
  if (profile.permissions.length === 0) {
    await sendToSlack({
      // :x:
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:magic_wand: user \`${profile.user}\` just lost all his/her permissions`,
          },
        },
      ],
    })
  } else {
    const permissions = profile.permissions
      .map((permission) => {
        const details = en.page.users.permissions[permission]
        return details
          ? `- *${details.name}*: _${details.description}_`
          : `- *${permission}*`
      })
      .join("\n")

    await sendToSlack({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:magic_wand: user \`${profile.user}\` has new permissions:\n\n${permissions}`,
          },
        },
      ],
    })
  }
}
