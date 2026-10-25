import { MIN_PASSWORD_LENGTH, OTP_LENGTH } from '@/config/auth'

const VN_PHONE = /^0\d{9}$/

export function isValidPhone(phone: string): boolean {
  return VN_PHONE.test(phone)
}

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

export function isCompleteOtp(otp: string): boolean {
  return otp.length === OTP_LENGTH
}

export function passwordError(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`
  if (password !== confirm) return 'Mật khẩu xác nhận không khớp'
  return null
}

// Only follow redirects inside the site: "/path" is fine, "//host" and "https://host" are not.
export function safeRedirect(target: string | null | undefined, fallback = '/'): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback
  return target
}
