import { MIN_PASSWORD_LENGTH, OTP_LENGTH } from '@/config/auth'

const VN_PHONE = /^0\d{9}$/

export function isValidPhone(phone: string): boolean {
  return VN_PHONE.test(phone)
}

// Registration takes Vietnamese mobiles only (03, 05, 07, 08, 09), same rule as the server's SignupRules.
const VN_MOBILE = /^0[35789]\d{8}$/

export function normalizeSignupPhone(phone: string): string {
  let digits = phone.trim().replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+84')) digits = '0' + digits.slice(3)
  else if (digits.startsWith('84') && digits.length === 11) digits = '0' + digits.slice(2)
  return digits
}

export function isValidSignupPhone(phone: string): boolean {
  return VN_MOBILE.test(normalizeSignupPhone(phone))
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
