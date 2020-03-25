import { Request, Response, json, NextFunction } from "express";
import RequestError from "./error";

export type Handler = (req: Request & any, res: Response & any, next: NextFunction) => Promise<any> | any
export default function handle(handler: Handler) {
  return function (req: Request, res: Response, next: NextFunction) {

    let nextCalled = false
    function callNext() {
      nextCalled = true
      next()
    }

    handler(req, res, callNext)
      .then((data: any) => {
        if (!nextCalled && !res.writableFinished) {
          res
            .status(defaultStatusCode(req))
            .json({ ok: true, data })
        }
      })
      .catch((err: RequestError) => {
        console.error(err);

        if (!nextCalled && !res.writableFinished) {
          const result: any = {
            ok: false,
            error: err.message,
          }

          if (err.data) {
            result.data = err.data
          }

          res
            .status(err.statusCode || RequestError.StatusCode.InternalServerError)
            .json(result)
        }
      })
  }
}

function defaultStatusCode(req: Request) {
  switch (req.method) {
    case 'PATCH':
    case 'POST':
      return 201

    case 'DELETE':
    case 'GET':
    default:
      return 200
  }
}