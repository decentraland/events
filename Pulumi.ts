// import { resolve } from "path";
import { buildGatsby } from "decentraland-gatsby-deploy/dist/recepies/buildGatsby";
const { gatsby } = require("./package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    // contentSource: resolve(__dirname, '../public'),
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    // this can't be enabled en order to support old links
    // contentRoutingRules: {
    //   '/en/*': '/$1'
    // },
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: [
      // root path it's not correctly handle by amazon
      // '/',
      '/en/*',
      '/event/',
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