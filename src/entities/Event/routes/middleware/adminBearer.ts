import { createHash, timingSafeEqual } from "crypto"

import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import env from "decentraland-gatsby/dist/utils/env"
import { NextFunction, Request, Response } from "express"

const ADMIN_TOKEN = env("EVENTS_ADMIN_AUTH_TOKEN", "")
const BEARER_PREFIX = "Bearer "

export type WithAdminBearer = { isAdminBearer?: boolean }

function safeCompare(value: string, expected: string): boolean {
  const valueHash = createHash("sha256").update(value).digest()
  const expectedHash = createHash("sha256").update(expected).digest()
  return timingSafeEqual(valueHash, expectedHash)
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

export async function adminBearer(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if ((req as Request & { auth?: string }).auth) {
    return next()
  }

  const authorization = req.headers.authorization
  if (
    typeof authorization !== "string" ||
    !authorization.startsWith(BEARER_PREFIX)
  ) {
    return next()
  }

  try {
    await assertAdminBearer(req)
    ;(req as Request & WithAdminBearer).isAdminBearer = true
    next()
  } catch (err) {
    next(err)
  }
}
