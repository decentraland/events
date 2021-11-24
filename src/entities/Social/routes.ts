import { resolve } from "path"
import { Request, Response } from "express"
import { escape } from "html-escaper"
import isUUID from "validator/lib/isUUID"
import { replaceHelmetMetadata } from "decentraland-gatsby/dist/entities/Gatsby/utils"
import { readOnce } from "decentraland-gatsby/dist/entities/Route/routes/file"
import { handleRaw } from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import { eventUrl, siteUrl } from "../Event/utils"
import { EventAttributes } from "../Event/types"
import EventModel from "../Event/model"
import copies from "../../intl/en.json"

export default routes((router) => {
  router.get("/event/", handleRaw(injectEventMetadata, "html"))
  router.get("/en/*", handleRaw(redirectToNewUrls, "html"))
})

async function readFile(req: Request) {
  const path = resolve(
    process.cwd(),
    "./public",
    "." + req.path,
    "./index.html"
  )
  return readOnce(path)
}

export async function injectEventMetadata(req: Request) {
  const id = String(req.query.id || "")
  const page = await readFile(req)
  if (isUUID(id)) {
    const event = await EventModel.findOne<EventAttributes>({
      id,
      rejected: false,
      approved: true,
    })

    if (event) {
      return replaceHelmetMetadata(page.toString(), {
        ...(copies.social.home as any),
        title: escape(event.name) + " | Decentraland Events",
        description: escape((event.description || "").trim()),
        image: event.image || "",
        url: eventUrl(event),
        "twitter:card": "summary_large_image",
      })
    }
  }

  const url = siteUrl().toString() + req.originalUrl.slice(1)
  return replaceHelmetMetadata(page.toString(), {
    ...(copies.social.home as any),
    url,
  })
}

export async function redirectToNewUrls(req: Request, res: Response) {
  const id = String(req.query.event || "")
  if (isUUID(id)) {
    res.redirect(eventUrl({ id }), 301)
  } else {
    res.redirect("/", 301)
  }
}
