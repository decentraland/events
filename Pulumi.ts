import { resolve } from "path";
import { buildGatsby } from "decentraland-gatsby-deploy/dist/recepies/buildGatsby";
const { gatsby } = require("./package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    contentDirectory: resolve(__dirname, '../public'),
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: [
      '/en/',
      '/en/me/',
      '/en/settings/',
      '/en/submit/',
      ...(gatsby.proxy || [])
    ],
    useBucket: [ '/poster/*' ],
    useEmail: true
  })
}