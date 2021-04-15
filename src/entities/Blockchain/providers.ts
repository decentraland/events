import { fromEndpoint } from "decentraland-gatsby/dist/entities/Blockchain/eth";
import { requiredEnv } from "decentraland-gatsby/dist/utils/env";
import roundRobin from "decentraland-gatsby/dist/utils/iterator/roundRobin";

const ETHEREUM_ENDPOINTS = requiredEnv('ETHEREUM_ENDPOINTS')
  .split(',')
  .filter(Boolean)

const ETHEREUM_PROVIDERS = ETHEREUM_ENDPOINTS
  .map(url => fromEndpoint(url))
  .filter(Boolean)

export default roundRobin(ETHEREUM_PROVIDERS)
