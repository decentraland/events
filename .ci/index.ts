import { buildGatsby } from "./helpers/buildGatsby";

export = async function main() {
  return buildGatsby({
    name: 'events',
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: process.env['CI_REGISTRY_IMAGE'],
    useBucket: [ '/poster/*' ],
    useEmail: true
  })
}