import { API_BASE } from '@/lib/apiBase'

/** Checks a link's code. Never throws: a network error counts as "not valid", the visitor just registers without a referrer. */
export async function checkReferral(code: string): Promise<{ valid: boolean; name: string }> {
  try {
    const res = await fetch(`${API_BASE}/ref/${encodeURIComponent(code)}`)
    const json = await res.json()
    if (!res.ok || json?.resultCode !== 1 || !json.data?.valid) return { valid: false, name: '' }
    return { valid: true, name: String(json.data.name ?? '') }
  } catch {
    return { valid: false, name: '' }
  }
}
