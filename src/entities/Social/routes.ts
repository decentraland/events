import { resolve } from 'path'
import { Request, Response } from "express";
import { escape } from "html-escaper";
import isUUID from "validator/lib/isUUID";
import { replaceHelmetMetadata } from "decentraland-gatsby/dist/entities/Gatsby/utils";
import { readOnce } from "decentraland-gatsby/dist/entities/Route/routes/file";
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import EventModel from "../Event/model";
import { EventAttributes } from "../Event/types";
import { eventUrl, siteUrl } from '../Event/utils';
import { AsyncHandler } from 'decentraland-gatsby/dist/entities/Route/handle';
import Context from 'decentraland-gatsby/dist/entities/Route/context';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';

export default routes((router) => {
  router.get('/', handle(injectHomeMetadata))
  router.get('/en/', handle(injectHomeMetadata))
  router.get('/me/', handle(injectHomeMetadata))
  router.get('/en/me/', handle(injectHomeMetadata))
  router.get('/settings/', handle(injectHomeMetadata))
  router.get('/en/settings/', handle(injectHomeMetadata))

  router.get('/submit/', handle(injectSubmitMetadata))
  router.get('/en/submit/', handle(injectSubmitMetadata))
})

function handle(handler: AsyncHandler) {
  return function (req: Request, res: Response) {
    handler(req, res, new Context(req, res))
      .then((html: string) => {
        if (!res.headersSent) {
          res.status(200)
        }

        if (!res.writableFinished) {
          res
            .type('text/html')
            .send(html)
        }
      })
      .catch((err: RequestError) => {
        readErrorFile().then((file) => {

          if (!res.headersSent) {
            res.status(err.statusCode || RequestError.NotFound)
          }

          if (!res.writableFinished) {
            res
              .type('text/html')
              .send(file)
          }
        })
      })
  }
}

async function readErrorFile() {
  const path = resolve(process.cwd(), './public/404.html')
  return readOnce(path)
}

async function readFile(req: Request) {
  const path = resolve(process.cwd(), './public', '.' + req.path, './index.html')
  return readOnce(path)
}

export async function injectHomeMetadata(req: Request) {
  const injectedEventMetadata = await injectEventMetadata(req)
  if (injectedEventMetadata) {
    return injectedEventMetadata
  }

  const page = await readFile(req)
  const url = siteUrl().toString() + req.originalUrl.slice(1)
  return replaceHelmetMetadata(page.toString(), {
    title: 'Decentraland Events',
    description: 'Live music, conferences, and more in a community built virtual world.',
    image: 'https://decentraland.org/images/decentraland.png',
    url,
    "og:type": 'website',
    "twitter:card": 'summary',
    "twitter:creator": '@decentraland',
    "twitter:site": '@decentraland'
  })
}

export async function injectSubmitMetadata(req: Request) {
  const page = await readFile(req)
  const url = siteUrl().toString() + req.originalUrl.slice(1)
  return replaceHelmetMetadata(page.toString(), {
    title: 'Submit an Event',
    description: 'Organize and host your own community event in Decentraland.',
    image: 'https://decentraland.org/images/decentraland.png',
    url,
    "og:site_name": "Decentraland Events",
    "og:type": 'website',
    "twitter:card": 'summary',
    "twitter:creator": '@decentraland',
    "twitter:site": '@decentraland'
  })
}

export async function injectEventMetadata(req: Request) {
  if (isUUID(req.query.event || '')) {
    const event = await EventModel.findOne<EventAttributes>({ id: req.query.event, rejected: false, approved: true })

    if (event) {
      const page = await readFile(req)
      return replaceHelmetMetadata(page.toString(), {
        title: escape(event.name) + ' | Decentraland Events',
        description: escape((event.description || '').trim()),
        image: event.image || '',
        url: eventUrl(event),
        "og:type": 'website',
        "og:site_name": 'Decentraland Events',
        "twitter:site": '@decentraland',
        "twitter:card": 'summary_large_image'
      })
    }
  }

  return null
}
