import { Logger } from "@ethersproject/logger"
import { setupEnv } from "decentraland-gatsby/dist/utils/env"

Logger.prototype.checkAbstract = function () {}
import dev from "./dev.json"
import local from "./local.json"
import prod from "./prod.json"
import stg from "./stg.json"

const envs = { local, dev, stg, prod }

setupEnv(envs)
