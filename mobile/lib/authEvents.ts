type Listener = () => void
let listener: Listener | null = null

export function setForceLogoutListener(fn: Listener | null) {
  listener = fn
}

export function triggerForceLogout() {
  listener?.()
}