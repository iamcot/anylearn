'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register, authModalOnSuccess } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  // Register form
  const [name, setName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [email, setEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)

  if (!isAuthModalOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await login(phone, password)
    setLoading(false)
    if (err) { setError(err); return }
    closeAuthModal()
    authModalOnSuccess?.()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (regPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return }
    setLoading(true)
    const { error: err } = await register(name, regPhone, email, regPassword)
    setLoading(false)
    if (err) { setError(err); return }
    closeAuthModal()
    authModalOnSuccess?.()
  }

  const switchTab = (t: 'login' | 'register') => { setTab(t); setError('') }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={closeAuthModal}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)' }} />
      <div style={{
        position: 'relative', background: 'white', borderRadius: 24, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 60px rgba(15,23,42,0.18)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e6edf4' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)} style={{
              flex: 1, padding: '18px 0', border: 0, cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t ? 'white' : '#f7fafc',
              color: tab === t ? '#00539b' : '#6d7a8a',
              fontWeight: tab === t ? 900 : 600, fontSize: 15,
              borderBottom: tab === t ? '2px solid #00539b' : '2px solid transparent',
            }}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
          <button onClick={closeAuthModal} style={{
            position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%',
            border: '1px solid #e6edf4', background: 'white', cursor: 'pointer', fontSize: 16,
            display: 'grid', placeItems: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#e73348', fontSize: 14 }}>
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Số điện thoại</label>
              <input className="field" type="tel" placeholder="Nhập số điện thoại" value={phone}
                onChange={e => setPhone(e.target.value)} required style={{ marginBottom: 14 }} />

              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Mật khẩu</label>
              <input className="field" type="password" placeholder="Nhập mật khẩu" value={password}
                onChange={e => setPassword(e.target.value)} required style={{ marginBottom: 20 }} />

              <button type="submit" className="btn btn--green" style={{ width: '100%', fontSize: 16, padding: '14px' }} disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 14, color: '#6d7a8a', fontSize: 14 }}>
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => switchTab('register')}
                  style={{ border: 0, background: 'transparent', color: '#00539b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Đăng ký ngay
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Họ và tên</label>
              <input className="field" type="text" placeholder="Nhập họ và tên" value={name}
                onChange={e => setName(e.target.value)} required style={{ marginBottom: 12 }} />

              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Số điện thoại</label>
              <input className="field" type="tel" placeholder="Nhập số điện thoại" value={regPhone}
                onChange={e => setRegPhone(e.target.value)} required style={{ marginBottom: 12 }} />

              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Email</label>
              <input className="field" type="email" placeholder="Nhập email" value={email}
                onChange={e => setEmail(e.target.value)} style={{ marginBottom: 12 }} />

              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Mật khẩu</label>
              <input className="field" type="password" placeholder="Nhập mật khẩu" value={regPassword}
                onChange={e => setRegPassword(e.target.value)} required style={{ marginBottom: 12 }} />

              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 6 }}>Xác nhận mật khẩu</label>
              <input className="field" type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} required style={{ marginBottom: 14 }} />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#6d7a8a', lineHeight: 1.5 }}>
                  Tôi đồng ý với{' '}
                  <Link href="/terms" target="_blank" style={{ color: '#00539b', fontWeight: 700 }}>
                    điều khoản sử dụng
                  </Link>
                  {' '}của anyLEARN
                </span>
              </label>

              <button type="submit" className="btn btn--green" style={{ width: '100%', fontSize: 16, padding: '14px' }} disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 14, color: '#6d7a8a', fontSize: 14 }}>
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => switchTab('login')}
                  style={{ border: 0, background: 'transparent', color: '#00539b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Đăng nhập
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
