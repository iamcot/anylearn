// Where a visitor came from (plan 19.A4): the first link with UTM parameters is kept 30 days in this browser and sent with
// the registration, so the account's first source is known. A later link with UTM does not replace it (first touch).

export const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
export type UtmField = (typeof UTM_FIELDS)[number]

export interface Acquisition {
  utm: Partial<Record<UtmField, string>>
  /** Path and query of the first page with UTM parameters. */
  landingPath: string
  /** Epoch milliseconds of that visit. */
  firstSeenAt: number
}

export const ACQUISITION_KEY = 'acquisition:v1'
export const ACQUISITION_TTL_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_VALUE = 100

/** The UTM values of a query string, trimmed and cut at 100 characters; empty when the link has none. */
export function readUtm(search: string): Partial<Record<UtmField, string>> {
  const params = new URLSearchParams(search)
  const out: Partial<Record<UtmField, string>> = {}
  for (const field of UTM_FIELDS) {
    const value = params.get(field)?.trim()
    if (value) out[field] = value.slice(0, MAX_VALUE)
  }
  return out
}

export function hasUtm(utm: Partial<Record<UtmField, string>>): boolean {
  return Object.keys(utm).length > 0
}

/** The stored first touch, or null when missing, damaged or older than 30 days. */
export function parseAcquisition(raw: string | null, now: number): Acquisition | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Acquisition>
    if (!value || typeof value.firstSeenAt !== 'number' || now - value.firstSeenAt > ACQUISITION_TTL_DAYS * DAY_MS) return null
    const utm = readUtm(new URLSearchParams(Object.entries(value.utm ?? {}).filter(([, v]) => typeof v === 'string') as [string, string][]).toString())
    if (!hasUtm(utm)) return null
    return { utm, landingPath: typeof value.landingPath === 'string' ? value.landingPath.slice(0, 300) : '/', firstSeenAt: value.firstSeenAt }
  } catch {
    return null
  }
}

/** What to keep after a visit: the existing first touch while it is valid, else this visit when it carries UTM values. */
export function nextAcquisition(stored: Acquisition | null, search: string, path: string, now: number): Acquisition | null {
  if (stored) return stored
  const utm = readUtm(search)
  if (!hasUtm(utm)) return null
  return { utm, landingPath: `${path}${search && !search.startsWith('?') ? '?' : ''}${search}`.slice(0, 300), firstSeenAt: now }
}

/** The fields the registration sends (flat, like the server reads them). */
export function signupFields(a: Acquisition | null): Record<string, string> {
  if (!a) return {}
  return { ...a.utm, landing_path: a.landingPath, first_seen_at: new Date(a.firstSeenAt).toISOString() }
}

/** One landing call per browser session and source: the key of this visit in sessionStorage. */
export function landingKey(utm: Partial<Record<UtmField, string>>): string {
  return `landing:${UTM_FIELDS.slice(0, 4).map(f => utm[f] ?? '').join('|')}`
}

export function readStoredAcquisition(now = Date.now()): Acquisition | null {
  try {
    return parseAcquisition(window.localStorage.getItem(ACQUISITION_KEY), now)
  } catch {
    return null
  }
}

export function storeAcquisition(a: Acquisition) {
  try {
    window.localStorage.setItem(ACQUISITION_KEY, JSON.stringify(a))
  } catch {}
}
