import { Request } from "express";
import { Address } from "web3x/address";
import Katalyst, { Avatar } from "decentraland-gatsby/dist/utils/api/Katalyst";
import API from "decentraland-gatsby/dist/utils/api/API";
import { middleware } from "../Middleware";
import RequestError from "../Route/error";
import param from "../Route/param";

export type WithProfile<R extends Request = Request> = R & {
  profile?: Avatar
}

export type WithProfileOptions = {
  optional?: boolean,
}

export function getUserParam(req: Request) {
  return param(req, 'user', Address.isAddress)
}

export function withProfile(options: WithProfileOptions = {}) {
  return middleware(async (req) => {
    const user = getUserParam(req).toLowerCase()
    const profile = await API.catch(Katalyst.get().getProfile(user))

    if (!profile && !options.optional) {
      throw new RequestError(`Not found profile "${user}"`, RequestError.StatusCode.NotFound)
    }

    Object.assign(req, { profile })
  })
}

