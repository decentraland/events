import { setupEnv } from "decentraland-gatsby/dist/utils/env"

import dev from "./dev.json"
import prod from "./prod.json"
import stg from "./stg.json"

const envs = { dev, stg, prod }

setupEnv(envs)
