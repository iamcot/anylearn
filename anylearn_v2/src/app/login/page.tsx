'use client'

import { useState } from 'react'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await login(phone, password)
    setLoading(false)
    if (err) { setError(err); return }
    const redirect = params.get('redirect') || '/'
    router.push(redirect)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color: '#17212f' }}>Đăng nhập</h1>
        <p style={{ margin: '0 0 28px', color: '#6d7a8a' }}>Chào mừng trở lại anyLEARN</p>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#e73348', fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Số điện thoại</label>
          <input className="field" type="tel" placeholder="Nhập số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} required style={{ marginBottom: 14 }} />

          <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Mật khẩu</label>
          <input className="field" type="password" placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required style={{ marginBottom: 24 }} />

          <button type="submit" className="btn btn--green" style={{ width: '100%', fontSize: 16, padding: 14 }} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, color: '#6d7a8a', fontSize: 14 }}>
          Chưa có tài khoản?{' '}
          <Link href="/register" style={{ color: '#00539b', fontWeight: 700 }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
