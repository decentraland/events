import { createHash, timingSafeEqual } from "crypto"

import { auth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { withAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import middleware from "decentraland-gatsby/dist/entities/Route/handle/middleware"
import env from "decentraland-gatsby/dist/utils/env"
import { NextFunction, Request, Response } from "express"

const ADMIN_TOKEN = env("EVENTS_ADMIN_AUTH_TOKEN", "")
const BEARER_PREFIX = "Bearer "

function safeCompare(value: string, expected: string): boolean {
  const valueHash = createHash("sha256").update(value).digest()
  const expectedHash = createHash("sha256").update(expected).digest()
  return timingSafeEqual(valueHash, expectedHash)
}

function hasBearerAuthorization(req: Pick<Request, "headers">): boolean {
  const authorization = req.headers.authorization
  return (
    typeof authorization === "string" && authorization.startsWith(BEARER_PREFIX)
  )
}

export async function assertAdminBearer(req: Pick<Request, "headers">) {
  if (!ADMIN_TOKEN) {
    throw new RequestError(
      "EVENTS_ADMIN_AUTH_TOKEN is not configured; events admin endpoints are disabled",
      RequestError.ServiceUnavailable
    )
  }

  const authorization = req.headers.authorization
  if (
    typeof authorization !== "string" ||
    !authorization.startsWith(BEARER_PREFIX)
  ) {
    throw new RequestError("Unauthorized", RequestError.Unauthorized)
  }

  const token = authorization.slice(BEARER_PREFIX.length)
  if (!safeCompare(token, ADMIN_TOKEN)) {
    throw new RequestError("Unauthorized", RequestError.Unauthorized)
  }
}

export const adminBearer = middleware(assertAdminBearer)

export function adminBearerOrAuth(options?: { withProfile?: boolean }) {
  const userAuth = auth()
  const userProfile = options?.withProfile ? withAuthProfile() : null

  return (req: Request, res: Response, next: NextFunction) => {
    if (hasBearerAuthorization(req)) {
      assertAdminBearer(req)
        .then(() => {
          ;(req as Request & { isAdminBearer?: boolean }).isAdminBearer = true
          next()
        })
        .catch(next)
      return
    }

    userAuth(req, res, (err?: unknown) => {
      if (err) return next(err as Error)
      if (!userProfile) return next()
      userProfile(req, res, next)
    })
  }
}

export function adminBearerOrOptionalAuth() {
  const userAuth = auth({ optional: true })

  return (req: Request, res: Response, next: NextFunction) => {
    if (hasBearerAuthorization(req)) {
      assertAdminBearer(req)
        .then(() => {
          ;(req as Request & { isAdminBearer?: boolean }).isAdminBearer = true
          next()
        })
        .catch(next)
      return
    }

    userAuth(req, res, next)
  }
}
