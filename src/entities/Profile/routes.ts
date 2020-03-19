import routes from "../Route/routes";
import { withProfile, WithProfile } from "./middleware";
import { Response } from "express";
import RequestError from "../Route/error";
import isURL from "validator/lib/isURL";

export default routes((router) => {
  router.get('profile/:user/face.png', withProfile(), redirectToFace)
  router.get('profile/:user/body.png', withProfile(), redirectToBody)
})

export function redirectTo(res: Response, url: any) {
  if (typeof url === 'string' && isURL(url)) {
    res.setHeader('Cache-Control', 'max-age=86400')
    res.redirect(302, url)
  } else {
    res.status(RequestError.StatusCode.NotFound).send()
  }
}

export function redirectToFace(req: WithProfile, res: Response) {
  redirectTo(res, req.profile?.avatar?.snapshots?.face)
}

export function redirectToBody(req: WithProfile, res: Response) {
  redirectTo(res, req.profile?.avatar?.snapshots?.body)
}