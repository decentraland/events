import fetch from 'isomorphic-fetch'
import isURL from 'validator/lib/isURL';
import env from 'decentraland-gatsby/dist/utils/env';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { Avatar } from 'decentraland-gatsby/dist/utils/api/Catalyst';
import Time from 'decentraland-gatsby/dist/utils/date/Time';
import { DeprecatedEventAttributes } from '../Event/types';
import logger from 'decentraland-gatsby/dist/entities/Development/logger';

const SLACK_WEBHOOK = env('SLACK_WEBHOOK', '')
const EVENTS_URL = env('EVENTS_URL', 'https://events.centraland.org/api')
const DECENTRALAND_URL = env('DECENTRALAND_URL', 'https://play.decentraland.org')

if (!isURL(SLACK_WEBHOOK)) {
  console.log(`missing config SLACK_WEBHOOK`)
}

export async function notifyNewEvent(event: DeprecatedEventAttributes) {
  logger.log(`sending new event "${event.id}" to slack`)
  await sendToSlack({
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":tada: New event submitted:"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": [
            `*<${url(event)}|${event.name}>* by ${event.user_name || 'Guest'}`,
            `_${event.description || 'No description'}_`,
            '',
            event.url && event.url.startsWith(DECENTRALAND_URL) && `at <${event.url}|${event.estate_name || event.scene_name || 'Decentraland'} (${event.coordinates.join(',')})>`,
            (!event.url || !event.url.startsWith(DECENTRALAND_URL)) && `at ${event.url}`
          ].filter(Boolean).join('\n')
        },
        "accessory": {
          "type": "image",
          "image_url": event.image,
          "alt_text": event.scene_name || 'Decentraland'
        }
      }
    ]
  })
}

export async function notifyApprovedEvent(event: DeprecatedEventAttributes) {
  logger.log(`sending approved event "${event.id}" to slack`)
  await sendToSlack({
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:white_check_mark: new event approved: *<${url(event)}|${event.name}>*`
        }
      }
    ]
  }
  )
}

const latestEditNotification = new Map<string, number>()
export async function notifyEditedEvent(event: DeprecatedEventAttributes) {
  const now = Date.now()
  const latestNotification = latestEditNotification.get(event.id) || 0
  if ((now - latestNotification) < Time.Minute) {
    return
  }

  logger.log(`sending edited event "${event.id}" to slack`)
  latestEditNotification.set(event.id, now)
  await sendToSlack({
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:pencil2: user ${event.user_name || 'Guest'} just edited his event: *<${url(event)}|${event.name}>*`
        }
      }
    ]
  })
}

export async function notifyUpcomingEvent(event: DeprecatedEventAttributes, emailNotifications: number, pushNotifications: number) {
  logger.log(`sending upcoming event "${event.id}" to slack`)
  await sendToSlack({
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `:runner: *<${url(event)}|${event.name}>* is about to start (sent: ${emailNotifications} :email:, ${pushNotifications} :bell:)`
        }
      }
    ]
  }
  )
}

const SEND_CLOUD_DOWN = 1000 * 60 * 5
let NEXT_ERROR_AT = 0
export async function notifyEventError(user: Avatar, error: RequestError) {
  if (Date.now() > NEXT_ERROR_AT) {
    NEXT_ERROR_AT = Date.now() + SEND_CLOUD_DOWN
    logger.log(`sending error to slack`)
    const userName = user.name || 'Guest'
    const userContact = user.email ? `<mailto:${user.email}|${userName} [${user.ethAddress}]>` : `${userName} [${user.ethAddress}]`
    const errorDetails = '```' + JSON.stringify({ message: error.message, statusCode: error.statusCode, data: error.data || null }, null, 2) + '```'
    await sendToSlack({
      // :x:
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:x: An error occurred while creating an event (user: ${userContact})\n\n${errorDetails}`
          }
        }
      ]
    })
  }
}

function url(event: DeprecatedEventAttributes) {
  return new URL(`/?event=${event.id}`, EVENTS_URL).toString()
}

async function sendToSlack(body: object) {
  if (!isURL(SLACK_WEBHOOK)) {
    return
  }

  try {
    const response = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
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