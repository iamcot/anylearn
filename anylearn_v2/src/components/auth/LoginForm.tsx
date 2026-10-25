'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'
import { rememberPhone, useRememberedPhone } from './useRememberedPhone'

interface Props {
  onSuccess: () => void
  onSwitchToRegister?: () => void
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: Props) {
  const { login } = useAuth()
  const remembered = useRememberedPhone()
  const [typedPhone, setTypedPhone] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const phone = typedPhone ?? remembered

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await login(phone, password)
    setLoading(false)
    if (err) { setError(err); return }
    rememberPhone(phone)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {error && <Alert kind="error">{error}</Alert>}
      <FormField label="Số điện thoại">
        <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="Nhập số điện thoại"
          value={phone} onChange={event => setTypedPhone(event.target.value)} required />
      </FormField>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="login-password" className="text-xs font-bold text-muted">Mật khẩu</label>
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-xs text-blue hover:underline">Quên mật khẩu?</Link>
        </div>
        <input id="login-password" className="field" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu"
          value={password} onChange={event => setPassword(event.target.value)} required />
      </div>
      <button type="submit" className="btn btn--green mt-2 w-full py-3.5 text-base" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
      <p className="m-0 text-center text-sm text-muted">
        Chưa có tài khoản?{' '}
        {onSwitchToRegister
          ? <button type="button" onClick={onSwitchToRegister} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold text-blue">Đăng ký ngay</button>
          : <Link href="/register" className="font-bold text-blue">Đăng ký ngay</Link>
        }
      </p>
    </form>
  )
}
