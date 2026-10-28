const KEY = 'device:v1'

/** A random id of this browser, kept in localStorage. It only feeds the risk score of the sticker game. */
export function deviceId(): string | null {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '')
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null
  }
}
