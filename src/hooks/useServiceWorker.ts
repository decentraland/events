import { useState } from "react"
import useAsyncEffect from "decentraland-gatsby/dist/hooks/useAsyncEffect"

let service = new Map<string, ServiceWorkerRegistration>()

export default function useServiceWorker(path: string = "/sw.js") {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(service.get(path) || null)

  useAsyncEffect(async () => {
    if (!!navigator?.serviceWorker?.register && !service.get(path)) {
      const reg = await navigator.serviceWorker.register(path)
      service.set(path, reg)
      setRegistration(reg)
    }
  }, [path])

  return registration
}
