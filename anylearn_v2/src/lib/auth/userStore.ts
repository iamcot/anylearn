import type { AuthUser } from '@/lib/api'

const STORAGE_KEY = 'anylearn_user'

const listeners = new Set<() => void>()

export function subscribeUser(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) listener() }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function readStoredUserRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredUser(user: AuthUser | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
  listeners.forEach(listener => listener())
}

export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || !('jwtToken' in parsed)) return null
    return parsed as AuthUser
  } catch {
    return null
  }
}
