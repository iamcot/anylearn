import { API_BASE } from '@/lib/apiBase'

export interface PolicyDoc {
  content: string
  updatedAt?: string
}

const REVALIDATE_SECONDS = 3600

export async function fetchDoc(key: string): Promise<PolicyDoc | null> {
  try {
    const res = await fetch(`${API_BASE}/doc/${key}`, { next: { revalidate: REVALIDATE_SECONDS } })
    const json = await res.json()
    if (json?.resultCode === 1 && json?.data) return json.data
  } catch {}
  return null
}
