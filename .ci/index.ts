import { buildGatsby } from "./helpers/buildGatsby";

const { proxy } = require("../package.json");

export = async function main() {
  return buildGatsby({
    name: 'events',
    usePublicTLD: process.env['USE_PUBLIC_TLD'] === 'true',
    serviceImage: '564327678575.dkr.ecr.us-east-1.amazonaws.com/events:2f488d38ffa4e152141271a4dcc36dc401fa0156', //process.env['CI_REGISTRY_IMAGE'],
    servicePaths: proxy,
    useBucket: [ '/poster/*' ],
    useEmail: true
  })
}