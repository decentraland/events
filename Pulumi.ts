// import { resolve } from "path";
import { buildGatsby } from "decentraland-gatsby-deploy/dist/recepies/buildGatsby";
const { gatsby } = require("./package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    // contentSource: resolve(__dirname, '../public'),
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    contentRoutingRules: {
      '/en/*': '/$1'
    },
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: [
      '/',
      '/me/',
      '/settings/',
      '/submit/',
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