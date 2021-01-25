import { buildGatsby } from "./helpers/buildGatsby";
const { gatsby } = require("../package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: [
      ...(gatsby.proxy || [])
    ],
    useBucket: [ '/poster/*' ],
    useEmail: true
  })
}