import { buildGatsby } from "./helpers/buildGatsby";
const { gatsby } = require("../package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: [
      '/',
      '/me/',
      '/settings/',
      '/submit/',
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