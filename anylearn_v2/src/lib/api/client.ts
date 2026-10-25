import { API_BASE } from '@/lib/apiBase'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 }, ...options })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json
  } catch {
    return null
  }
}

export async function authFetch<T>(path: string, token: string, options?: RequestInit): Promise<{ data: T | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options?.headers ?? {}) },
    })
    const json = await res.json()
    if (!res.ok) return { data: null, error: json?.message || 'Lỗi không xác định' }
    if (json?.resultCode === 0) return { data: null, error: json?.message || 'Lỗi không xác định' }
    return { data: json?.data ?? json }
  } catch (e) {
    return { data: null, error: 'Không thể kết nối máy chủ' }
  }
}
