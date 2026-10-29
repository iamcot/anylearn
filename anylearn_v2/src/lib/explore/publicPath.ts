/** Pages under /fun that a visitor may open without an account: the public page of a Khám phá post (plan 19.A3). */
export function isPublicFunPath(pathname: string | null | undefined): boolean {
  return /^\/fun\/explore\/\d+(?:\/[^/]+)?\/?$/.test(pathname ?? '')
}

/** The id of the Khám phá post a public address points to, or null. */
export function publicPostId(pathname: string | null | undefined): number | null {
  const m = (pathname ?? '').match(/^\/fun\/explore\/(\d+)(?:\/|$)/)
  return m ? Number(m[1]) : null
}

/** The query string of a request without the old `p` parameter, so UTM parameters survive a redirect. */
export function keptQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'p' || value == null) continue
    for (const v of Array.isArray(value) ? value : [value]) query.append(key, v)
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}
