import { resolve } from 'path'
import { Request } from "express";
import { escape } from "html-escaper";
import isUUID from "validator/lib/isUUID";
import { replaceHelmetMetadata } from "decentraland-gatsby/dist/entities/Gatsby/utils";
import { readOnce } from "decentraland-gatsby/dist/entities/Route/routes/file";
import { handleRaw } from 'decentraland-gatsby/dist/entities/Route/handle';
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import { eventUrl, siteUrl } from '../Event/utils';
import { EventAttributes } from "../Event/types";
import EventModel from "../Event/model";
import copies from '../../intl/en.json'

export default routes((router) => {
  router.get('/', handleRaw(injectHomeMetadata, 'html'))
  router.get('/me/', handleRaw(injectHomeMetadata, 'html'))
  router.get('/settings/', handleRaw(injectHomeMetadata, 'html'))
  router.get('/submit/', handleRaw(injectSubmitMetadata, 'html'))
})

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
    ...copies.social.home as any,
    url
  })
}

export async function injectSubmitMetadata(req: Request) {
  const page = await readFile(req)
  const url = siteUrl().toString() + req.originalUrl.slice(1)
  return replaceHelmetMetadata(page.toString(), {
    ...copies.social.submit as any,
    url
  })
}

export async function injectEventMetadata(req: Request) {
  const id = String(req.query.event || '')
  if (isUUID(id)) {
    const event = await EventModel.findOne<EventAttributes>({ id, rejected: false, approved: true })

    if (event) {
      const page = await readFile(req)
      return replaceHelmetMetadata(page.toString(), {
        ...copies.social.home as any,
        title: escape(event.name) + ' | Decentraland Events',
        description: escape((event.description || '').trim()),
        image: event.image || '',
        url: eventUrl(event),
        "twitter:card": 'summary_large_image'
      })
    }
  }

  return null
}
