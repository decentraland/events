import { setupEnv } from "decentraland-gatsby/dist/utils/env"

import dev from "./dev.json"
import local from "./local.json"
import prod from "./prod.json"
import stg from "./stg.json"

const envs = { local, dev, stg, prod }

setupEnv(envs)
