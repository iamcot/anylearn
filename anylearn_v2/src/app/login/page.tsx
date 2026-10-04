'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('anylearn_last_phone')
    if (saved) setPhone(saved)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await login(phone, password)
    setLoading(false)
    if (err) { setError(err); return }
    localStorage.setItem('anylearn_last_phone', phone)
    const redirect = params.get('redirect') || '/'
    router.push(redirect)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-5">
      <div className="bg-white border border-line rounded-3xl px-9 py-10 w-full max-w-[420px] shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <h1 className="m-0 mb-2 text-[28px] font-black text-ink">Đăng nhập</h1>
        <p className="m-0 mb-7 text-muted">Chào mừng trở lại anyLEARN</p>

        {error && <div className="bg-red-soft border border-[#ffc9c9] rounded-xl px-3.5 py-2.5 mb-4 text-red text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="block font-bold text-xs text-muted mb-1.5">Số điện thoại</label>
          <input className="field mb-3.5" type="tel" placeholder="Nhập số điện thoại"
            value={phone} onChange={e => setPhone(e.target.value)} required />
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-xs text-muted">Mật khẩu</label>
            <Link href="/forgot-password" className="text-xs text-blue hover:underline">Quên mật khẩu?</Link>
          </div>
          <input className="field mb-6" type="password" placeholder="Nhập mật khẩu"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn btn--green w-full text-base py-3.5" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center mt-4 text-muted text-sm">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue font-bold">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
