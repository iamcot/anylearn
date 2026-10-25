import { describe, expect, it } from 'vitest'
import { digitsOnly, isCompleteOtp, isValidPhone, passwordError, safeRedirect } from './validation'

describe('isValidPhone', () => {
  it('accepts 10 digits starting with 0', () => {
    expect(isValidPhone('0374900344')).toBe(true)
  })

  it('rejects other shapes', () => {
    expect(isValidPhone('374900344')).toBe(false)
    expect(isValidPhone('037490034')).toBe(false)
    expect(isValidPhone('03749003445')).toBe(false)
    expect(isValidPhone('0374 900 344')).toBe(false)
  })
})

describe('otp helpers', () => {
  it('keeps digits only and caps the length', () => {
    expect(digitsOnly('12a3-45678', 6)).toBe('123456')
  })

  it('knows when the code is complete', () => {
    expect(isCompleteOtp('123456')).toBe(true)
    expect(isCompleteOtp('12345')).toBe(false)
  })
})

describe('passwordError', () => {
  it('requires the minimum length first, then a matching confirmation', () => {
    expect(passwordError('12345', '12345')).toBe('Mật khẩu phải có ít nhất 6 ký tự')
    expect(passwordError('123456', '654321')).toBe('Mật khẩu xác nhận không khớp')
    expect(passwordError('123456', '123456')).toBeNull()
  })
})

describe('safeRedirect', () => {
  it('keeps paths inside the site', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout')
    expect(safeRedirect('/search?q=a&page=2')).toBe('/search?q=a&page=2')
  })

  it('falls back for external or malformed targets', () => {
    expect(safeRedirect('https://evil.example')).toBe('/')
    expect(safeRedirect('//evil.example')).toBe('/')
    expect(safeRedirect('/\\evil.example')).toBe('/')
    expect(safeRedirect('javascript:alert(1)')).toBe('/')
    expect(safeRedirect(null)).toBe('/')
    expect(safeRedirect('', '/today')).toBe('/today')
  })
})
