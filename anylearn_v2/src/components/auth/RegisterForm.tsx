'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { passwordError } from '@/lib/auth/validation'
import { MIN_PASSWORD_LENGTH } from '@/config/auth'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'
import { afterRegisterPath, clearReferral, parseStoredReferral, readReferralRaw } from '@/lib/referral/store'

interface Props {
  // Gets the page a friend's link leads to (null for a normal registration, so the caller keeps its own destination).
  onSuccess: (redirectTo?: string | null) => void
  onSwitchToLogin?: () => void
}

const subscribeNever = () => () => {}

const EMPTY = { name: '', phone: '', email: '', password: '', confirm: '' }

export default function RegisterForm({ onSuccess, onSwitchToLogin }: Props) {
  const { register } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // The link's code lives in localStorage, which the server render cannot see, so it is read after hydration.
  const referralRaw = useSyncExternalStore(subscribeNever, readReferralRaw, () => null)
  const referral = useMemo(() => parseStoredReferral(referralRaw), [referralRaw])

  const bind = (field: keyof typeof EMPTY) => ({
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues(prev => ({ ...prev, [field]: event.target.value })),
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const problem = passwordError(values.password, values.confirm)
    if (problem) { setError(problem); return }
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return }
    setLoading(true)
    const { error: err } = await register(values.name, values.phone, values.email, values.password, referral ? { ref: referral.code, game: referral.game } : undefined)
    setLoading(false)
    if (err) { setError(err); return }
    const redirectTo = afterRegisterPath(referral)
    clearReferral()
    onSuccess(redirectTo)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {referral?.name && <Alert kind="success">Bạn được {referral.name} giới thiệu. Đăng ký để cùng chơi và nhận quà.</Alert>}
      {error && <Alert kind="error">{error}</Alert>}
      <FormField label="Họ và tên">
        <input className="field" type="text" autoComplete="name" placeholder="Nhập họ và tên" {...bind('name')} required />
      </FormField>
      <FormField label="Số điện thoại">
        <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="Nhập số điện thoại" {...bind('phone')} required />
      </FormField>
      <FormField label="Email">
        <input className="field" type="email" autoComplete="email" placeholder="Nhập email (tùy chọn)" {...bind('email')} />
      </FormField>
      <FormField label="Mật khẩu">
        <input className="field" type="password" autoComplete="new-password" placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`} {...bind('password')} required />
      </FormField>
      <FormField label="Xác nhận mật khẩu">
        <input className="field" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" {...bind('confirm')} required />
      </FormField>

      <label className="mt-1 flex min-h-11 cursor-pointer items-start gap-2.5">
        <input type="checkbox" checked={agreedTerms} onChange={event => setAgreedTerms(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-green" />
        <span className="text-xs leading-relaxed text-muted">
          Tôi đồng ý với <Link href="/terms" target="_blank" className="font-bold text-blue">điều khoản sử dụng</Link> của anyLEARN
        </span>
      </label>

      <button type="submit" className="btn btn--green w-full py-3.5 text-base" disabled={loading}>
        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
      <p className="m-0 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        {onSwitchToLogin
          ? <button type="button" onClick={onSwitchToLogin} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold text-blue">Đăng nhập</button>
          : <Link href="/login" className="font-bold text-blue">Đăng nhập</Link>
        }
      </p>
    </form>
  )
}
