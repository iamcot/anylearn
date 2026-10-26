const CHUNK_ERROR = /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i

const RELOAD_KEY = 'anylearn.chunkReloadAt'
const RELOAD_COOLDOWN_MS = 30_000

/** After a deploy, an open tab asks for script files of the old build that no longer exist. */
export function isChunkLoadError(error: { name?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  return CHUNK_ERROR.test(`${error.name ?? ''} ${error.message ?? ''}`)
}

/** One automatic reload per cooldown: a real outage must show the error page, not loop. */
export function mayReloadNow(lastReloadAt: number | null, now: number): boolean {
  return lastReloadAt === null || now - lastReloadAt > RELOAD_COOLDOWN_MS
}

export function reloadOnceForNewBuild(error: { name?: string; message?: string }): boolean {
  if (!isChunkLoadError(error)) return false
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || null
    if (!mayReloadNow(last, Date.now())) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
