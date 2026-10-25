// What the server needs to log a search: a random ref per search (a click names it), a random id of this browser,
// and who the visitor said the courses are for. Nothing here is personal data.
export interface SearchTracking {
  ref: string
  sessionKey: string
  audience?: 'child' | 'self'
  learnerAge?: number
  token?: string
}

const ID_LENGTH = 20
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function randomId(random: () => number = Math.random, length = ID_LENGTH): string {
  let id = ''
  for (let index = 0; index < length; index++) id += ALPHABET[Math.floor(random() * ALPHABET.length)]
  return id
}

// Query string added to a search request; empty values are left out.
export function trackingQuery(tracking: SearchTracking): string {
  const params = new URLSearchParams({ ref: tracking.ref, sk: tracking.sessionKey })
  if (tracking.audience) params.set('aud', tracking.audience)
  if (tracking.learnerAge !== undefined) params.set('lage', String(tracking.learnerAge))
  return `&${params.toString()}`
}
