const DEFAULT_PUBLIC_BASE = '/v2/api'
const DEFAULT_SERVER_ORIGIN = 'http://localhost:8080'

// The browser calls the API on the same origin (`/v2/api`), so the site works through localhost, a LAN IP or
// ngrok without exposing port 8080. Server rendering has no origin to resolve a relative path against, so it
// goes straight to the Java server instead.
export function resolveApiBase(publicBase: string | undefined, serverOrigin: string | undefined, onServer: boolean) {
  const base = publicBase || DEFAULT_PUBLIC_BASE
  if (!onServer || !base.startsWith('/')) return base
  return `${serverOrigin || DEFAULT_SERVER_ORIGIN}${base}`
}

export const API_BASE = resolveApiBase(
  process.env.NEXT_PUBLIC_API_URL,
  process.env.API_SERVER_ORIGIN,
  typeof window === 'undefined',
)
