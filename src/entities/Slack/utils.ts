import fetch from 'isomorphic-fetch'
import { EventAttributes } from '../Event/types';
import isURL from 'validator/lib/isURL';
import env from 'decentraland-gatsby/dist/utils/env';
import { resolve } from 'url'

const SLACK_WEBHOOK = env('SLACK_WEBHOOK', '')
const EVENTS_URL = env('EVENTS_URL', 'https://events.centraland.org/api')
const DECENTRALAND_URL = env('DECENTRALAND_URL', 'https://play.decentraland.org')

if (!isURL(SLACK_WEBHOOK)) {
  console.log(`missing config SLACK_WEBHOOK`)
}

export async function notifyNewEvent(event: EventAttributes) {
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
            event.url && event.url.startsWith(DECENTRALAND_URL) && `at <${event.url}|${event.scene_name || 'Decentraland'} (${event.coordinates.join(',')})>`,
            (!event.url || event.url.startsWith(DECENTRALAND_URL)) && `at ${event.url}`
          ].filter(Boolean).join('\n')
        },
        "accessory": {
          "type": "image",
          "image_url": event.image,
          "alt_text": event.scene_name || 'Decentraland'
        }
      }
    ]
  }
  )
}

export async function notifyApprovedEvent(event: EventAttributes) {
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

function url(event: EventAttributes) {
  return resolve(EVENTS_URL, `/en/?event=${event.id}`)
}

async function sendToSlack(body: object) {
  if (!isURL(SLACK_WEBHOOK)) {
    return
  }

  console.log(`sending to: ${SLACK_WEBHOOK}: ${JSON.stringify(body, null, 2)}`)

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
      console.error(`Slack bad request: ${data} (${response.status})`)
    }
  } catch (error) {
    console.error(`Slack service error: ` + error.message, error)
  }
} 