import xml from 'xml'
import { handleRaw } from "decentraland-gatsby/dist/entities/Route/handle"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import EventModel from '../Event/model'
import { SITEMAP_ITEMS_PER_PAGE } from '../Event/types'
import { eventUrl, siteUrl } from '../Event/utils'
import { Request } from 'express'

export default routes((router) => {
  router.get('/sitemap.xml', handleRaw(getIndexSitemap, 'application/xml'))
  router.get('/sitemap.static.xml', handleRaw(getStaticSitemap, 'application/xml'))
  router.get('/sitemap.events.xml', handleRaw(getEventsSitemap, 'application/xml'))
})

export async function getIndexSitemap() {
  // <?xml version="1.0" encoding="UTF-8"?>
  // <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  //   <sitemap>
  //     <loc>http://www.example.com/sitemap1.xml.gz</loc>
  //   </sitemap>
  //   <sitemap>
  //     <loc>http://www.example.com/sitemap2.xml.gz</loc>
  //   </sitemap>
  // </sitemapindex>
  const events = await EventModel.countEvents()
  const pages = Math.ceil(events / SITEMAP_ITEMS_PER_PAGE)

  return [
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `<sitemap><loc>${siteUrl('/sitemap.static.xml')}</loc></sitemap>`,
    ...Array.from(
        Array(pages),
        (_, i) => `<sitemap><loc>${siteUrl(`/sitemap.events.xml`)}?page=${i}</loc></sitemap>`
    ),
    '</sitemapindex>'
  ].join('')
}

export async function getStaticSitemap() {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `<url><loc>${siteUrl('/')}</loc></url>`,
    `<url><loc>${siteUrl('/submit/')}</loc></url>`,
    '</sitemapindex>'
  ].join('')
}

export async function getEventsSitemap(req: Request) {

  const page = Number(req.query.page)
  if (
    !Number.isFinite(page) ||
    String(page | 0) !== req.query.page
  ) {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '</urlset>',
    ].join('')
  }

  const events = await EventModel.getSitemapEvents(page)
  return [
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...events.map(event => `<url><loc>${eventUrl(event)}</loc></url>`,),
    '</sitemapindex>'
  ].join('')
}