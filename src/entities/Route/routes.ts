import { Router, RouterOptions } from 'express'
import handle from './handle';
import env from 'decentraland-gatsby/dist/utils/env';

export type RouterHandler = (router: Router) => void

const IMAGE = env('IMAGE', 'unknown:unknown')
const [image, version] = IMAGE.split(':')

export default function routes(handle: RouterHandler, options: RouterOptions = {}): Router {
  const router = Router(options)
  handle(router)
  return router
}

export function status() {
  return routes((router) => {
    router.get('/status', handle(async () => ({
      image,
      version,
      timestamp: new Date()
    })))
  })
}