import { buildGatsby } from "./helpers/buildGatsby";

const { proxy } = require("../package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    servicePaths: proxy,
    useBucket: [ '/poster/*' ],
    useEmail: true
  })
}