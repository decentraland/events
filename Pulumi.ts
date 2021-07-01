// import { resolve } from "path";
import { buildGatsby } from "decentraland-gatsby-deploy/dist/recepies/buildGatsby";
const { gatsby } = require("./package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    // contentSource: resolve(__dirname, '../public'),
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: [
      '/en/',
      '/en/me/',
      '/en/settings/',
      '/en/submit/',
      '/api/*',
      '/verify',
      '/unsubscribe',
      '/metrics/*',
      '/metrics',
      '/sitemap.xml',
      '/sitemap.static.xml',
      '/sitemap.events.xml',
    ],
    useBucket: [ '/poster/*' ],
    useEmail: true
  })
}