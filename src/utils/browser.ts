import { callOnce } from "./callOnce"

export const isMobile = callOnce(() => {
  if (
    /Mobi/i.test(navigator.userAgent) ||
    /Android/i.test(navigator.userAgent)
  ) {
    return true
  }

  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    return true
  }

  if (
    /Macintosh/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 1
  ) {
    // iPad pro
    return true
  }

  return false
})
