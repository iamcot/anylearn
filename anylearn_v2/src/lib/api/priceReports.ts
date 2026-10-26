import { API_BASE } from '@/lib/apiBase'
import type { PriceReportPayload } from '@/lib/promise/priceReport'

// Open to visitors without an account: the token is only sent when there is one, to link the report to it.
export async function createPriceReport(payload: PriceReportPayload, token?: string): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/price-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json?.resultCode === 0) return { error: json?.message || 'Chưa gửi được, vui lòng thử lại' }
    return {}
  } catch {
    return { error: 'Không thể kết nối máy chủ' }
  }
}
