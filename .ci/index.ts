// import { publicTLD } from "dcl-ops-lib/domain";
// import { buildGatsby } from "./helpers/buildGatsby";
// import { variable, secret } from "./helpers/env";
import { conf } from "./helpers/env";

export = async function main() {
  conf()

  // return buildGatsby({
  //   name: 'events',
  //   usePublicTLD: publicTLD === 'org',


  //   serviceImage: 'decentraland/events',
  //   serviceEnvironment: [
  //     variable('INITIAL_BLOCK_NUMBER', 'latest'),

  //     variable('ADMIN_ADDRESSES'),

  //     // pulumi config set --secret ENV "VALUE"
  //     secret('CONNECTION_STRING'),
  //     secret('ETHEREUM_ENDPOINTS'),
  //     secret('BANK_PRIVATE_KEY'),
  //   ]
  // })
}