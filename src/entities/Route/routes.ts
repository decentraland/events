import { Router, RouterOptions } from 'express'
import handle from './handle';

export type RouterHandler = (router: Router) => void

export default function routes(handle: RouterHandler, options: RouterOptions = {}): Router {
  const router = Router(options)
  handle(router)
  return router
}

export function status() {
  return routes((router) => {
    router.get('/status', handle(async () => new Date()))
  })
}