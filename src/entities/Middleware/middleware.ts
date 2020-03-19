import { Request, Response, NextFunction } from "express";
import RequestError from "../Route/error";
import { server } from "decentraland-server";

export type AsyncMiddleware = (req: Request, res: Response) => Promise<any>;

export default function middleware(handle: AsyncMiddleware) {
  return (req: Request, res: Response, next: NextFunction) => {
    handle(req, res)
      .then(() => next())
      .catch((err: RequestError) => {
        console.error('Middleware Error: ', err)
        return res
          .status(err.statusCode || RequestError.StatusCode.InternalServerError)
          .json(server.sendError(err.data || null, err.message));
      });
  };
}
