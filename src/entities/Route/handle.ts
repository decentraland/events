import { Request, Response, json } from "express";
import RequestError from "./error";

export type Handler = (req: Request & any, res: Response & any) => Promise<any> | any
export default function handle(handler: Handler) {
  return function (req: Request, res: Response) {
    handler(req, res)
      .then((data: any) => {
        res
          .status(defaultStatusCode(req))
          .json({ ok: true, data })
      })
      .catch((err: RequestError) => {
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

        console.error(err);
      })
  }
}

function defaultStatusCode(req: Request) {
  switch (req.method) {
    case 'PATCH':
    case 'POST':
      return 201

    case 'DELETE':
      return 204

    case 'GET':
    default:
      return 200
  }
}