import routes from "decentraland-gatsby/dist/entities/Route/routes";
import { withSocialUserAgent, WithSocialUserAgent } from "./middleware";
import { Response, NextFunction } from "express";
import EventModel from "../Event/model";
import isUUID from "validator/lib/isUUID";
import { EventAttributes } from "../Event/types";
import env from "decentraland-gatsby/dist/utils/env";
import { resolve } from 'url'

const EVENTS_URL = env('EVENTS_URL', 'https://events.centraland.org/api')

export default routes((router) => {
  router.use('/', withSocialUserAgent() as any, injectSocialTag as any)
  router.use('/:lang(en|es|fr|ja|zh|ko)', withSocialUserAgent() as any, injectSocialTag as any)
})

export function injectSocialTag(req: WithSocialUserAgent, res: Response, next: NextFunction) {
  if (!req.isSocialUserAgent() || !isUUID(req.query.event)) {
    return next()
  }

  EventModel.findOne<EventAttributes>({ id: req.query.event, rejected: false })
    .then((event) => {
      if (!event) {
        return next()
      } else {
        res.status(200).send(template(event, resolve(EVENTS_URL, req.originalUrl)))
      }
    })
}

const template = (event: EventAttributes, url: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${event.name}</title>
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@decentraland" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${event.name}" />
  ${event.description && `<meta property="og:description" content="${event.description}" />` || ''}
  <meta property="og:image" content="${event.image}" />
</head>
<body></body>
</html>`
