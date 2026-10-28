import { API_BASE } from '@/lib/apiBase'

export interface AuthUser {
  id: number
  name: string
  firstName?: string
  phone: string
  email?: string
  role: string
  image?: string
  walletM?: number
  walletC?: number
  apiToken: string
  jwtToken: string
}

export async function loginApi(phone: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/login?phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`)
    const json = await res.json()
    if (!res.ok || json?.resultCode !== 1) return { user: null, error: json?.message || 'Đăng nhập thất bại' }
    return { user: json.data }
  } catch {
    return { user: null, error: 'Không thể kết nối máy chủ' }
  }
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function sendPasswordOtp(phone: string): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/password/otp?phone=${encodeURIComponent(phone)}`)
    const json = await res.json()
    if (json?.resultCode === 0) return { error: json?.message || 'Không thể gửi OTP' }
    return {}
  } catch {
    return { error: 'Không thể kết nối máy chủ' }
  }
}

export async function verifyPasswordOtp(phone: string, otp: string): Promise<{ resetToken?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/otp/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    const json = await res.json()
    if (json?.resultCode === 0) return { error: json?.message || 'OTP không đúng' }
    return { resetToken: json?.data?.resetToken }
  } catch {
    return { error: 'Không thể kết nối máy chủ' }
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const json = await res.json()
    if (json?.resultCode === 0) return { error: json?.message || 'Không thể đặt lại mật khẩu' }
    return {}
  } catch {
    return { error: 'Không thể kết nối máy chủ' }
  }
}


export async function registerApi(name: string, phone: string, email: string, password: string, referral?: { ref: string; game: string | null; ach?: string | null }): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password, ref: referral?.ref, game: referral?.game, ach: referral?.ach }),
    })
    const json = await res.json()
    if (!res.ok || json?.resultCode !== 1) return { user: null, error: json?.message || 'Đăng ký thất bại' }
    return { user: json.data }
  } catch {
    return { user: null, error: 'Không thể kết nối máy chủ' }
  }
}
