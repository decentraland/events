import routes from "../Route/routes";
import { withSocialUserAgent, WithSocialUserAgent } from "./middleware";
import { Response, NextFunction } from "express";
import handle from "../Route/handle";
import Event from "../Event/model";
import isUUID from "validator/lib/isUUID";
import { EventAttributes } from "../Event/types";


export default routes((router) => {
  router.use('/:lang(en|es|fr|ja|zh|ko)', withSocialUserAgent() as any, handle(injectSocialTag))
})

export async function injectSocialTag(req: WithSocialUserAgent, res: Response, next: NextFunction) {
  if (!req.isSocialUserAgent() || !isUUID(req.query.event)) {
    return next()
  }

  const event = await Event.findOne<EventAttributes>({ id: req.query.event })
  if (!event) {
    return next()
  }

  res.status(200).send(template(event))
}

const template = (event: EventAttributes) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${event.name}</title>
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@decentraland" />
  <meta property="og:url" content="${event.url}" />
  <meta property="og:title" content="${event.name}" />
  <meta property="og:description" content="${event.description}" />
  <meta property="og:image" content="${event.image}" />
</head>
<body></body>
</html>`
