import { Request } from "express";
import isEthereumAddress from 'validator/lib/isEthereumAddress'
import Katalyst, { Avatar } from "decentraland-gatsby/dist/utils/api/Katalyst";
import API from "decentraland-gatsby/dist/utils/api/API";
import { middleware } from "decentraland-gatsby/dist/entities/Route/handle";
import RequestError from "decentraland-gatsby/dist/entities/Route/error";
import param from "decentraland-gatsby/dist/entities/Route/param";
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware";

export type WithProfile<R extends Request = Request> = R & {
  profile?: Avatar
}

export type WithAuthProfile<R extends Request = Request> = R & {
  authProfile?: Avatar
}

export type WithProfileOptions = {
  optional?: boolean,
}

export function withProfile(options: WithProfileOptions = {}) {
  return middleware(async (req: Request<{ user: string }>) => {
    let profile: Avatar | null = null
    const user = req.params.user
    if (!isEthereumAddress(user || '') && !options.optional) {
      throw new RequestError(`Invalid param user: "${user}"`, RequestError.NotFound)
    }

    if (user) {
      profile = await API.catch(Katalyst.get().getProfile(user))
      if (!profile && !options.optional) {
        throw new RequestError(`Not found profile for "${user}"`, RequestError.NotFound)
      }
    }

    Object.assign(req, { profile })
  })
}

export function withAuthProfile(options: WithProfileOptions = {}) {
  return middleware(async (req) => {
    const user = (req as WithAuth).auth

    if (!user && !options.optional) {
      throw new RequestError(`Not found user "${user}"`, RequestError.Forbidden)
    } else if (!user) {
      return
    }

    const authProfile = await API.catch(Katalyst.get().getProfile(user))

    if (!authProfile && !options.optional) {
      throw new RequestError(`Not found profile for "${user}"`, RequestError.NotFound)
    }

    Object.assign(req, { authProfile })
  })
}
