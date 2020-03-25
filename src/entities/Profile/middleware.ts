import { Request } from "express";
import { Address } from "web3x/address";
import Katalyst, { Avatar } from "decentraland-gatsby/dist/utils/api/Katalyst";
import API from "decentraland-gatsby/dist/utils/api/API";
import { middleware } from "../Middleware";
import RequestError from "../Route/error";
import param from "../Route/param";
import { WithAuth } from "../Auth/middleware";

export type WithProfile<R extends Request = Request> = R & {
  profile?: Avatar
}

export type WithAuthProfile<R extends Request = Request> = R & {
  authProfile?: Avatar
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
      throw new RequestError(`Not found profile for "${user}"`, RequestError.StatusCode.NotFound)
    }

    Object.assign(req, { profile })
  })
}

export function withAuthProfile(options: WithProfileOptions = {}) {
  return middleware(async (req) => {
    const user = (req as WithAuth).auth

    if (!user && !options.optional) {
      throw new RequestError(`Not found user "${user}"`, RequestError.StatusCode.Forbidden)
    } else if (!user) {
      return
    }

    const authProfile = await API.catch(Katalyst.get().getProfile(user))

    if (!authProfile && !options.optional) {
      throw new RequestError(`Not found profile for "${user}"`, RequestError.StatusCode.NotFound)
    }

    Object.assign(req, { authProfile })
  })
}
