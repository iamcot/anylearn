'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register, authModalOnSuccess } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={closeAuthModal}>
      <div className="absolute inset-0 bg-ink/50" />
      <div className="relative bg-white rounded-3xl w-full max-w-[420px] shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Tabs */}
        <div className="flex border-b border-line">
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`flex-1 py-[18px] border-0 cursor-pointer font-[inherit] text-[15px] transition-colors
                ${tab === t
                  ? 'bg-white text-blue font-black border-b-2 border-blue'
                  : 'bg-bg text-muted font-semibold border-b-2 border-transparent'
                }`}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
          <button onClick={closeAuthModal}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border border-line bg-white cursor-pointer text-base grid place-items-center">
            ✕
          </button>
        </div>

        <div className="px-7 pt-7 pb-6">
          {error && (
            <div className="bg-red-soft border border-[#ffc9c9] rounded-xl px-3.5 py-2.5 mb-4 text-red text-sm">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <label className="block font-bold text-xs text-muted mb-1.5">Số điện thoại</label>
              <input className="field mb-3.5" type="tel" placeholder="Nhập số điện thoại"
                value={phone} onChange={e => setPhone(e.target.value)} required />
              <label className="block font-bold text-xs text-muted mb-1.5">Mật khẩu</label>
              <input className="field mb-5" type="password" placeholder="Nhập mật khẩu"
                value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" className="btn btn--green w-full text-base py-3.5" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <p className="text-center mt-3.5 text-muted text-sm">
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => switchTab('register')}
                  className="border-0 bg-transparent text-blue font-bold cursor-pointer font-[inherit]">
                  Đăng ký ngay
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <label className="block font-bold text-xs text-muted mb-1.5">Họ và tên</label>
              <input className="field mb-3" type="text" placeholder="Nhập họ và tên"
                value={name} onChange={e => setName(e.target.value)} required />
              <label className="block font-bold text-xs text-muted mb-1.5">Số điện thoại</label>
              <input className="field mb-3" type="tel" placeholder="Nhập số điện thoại"
                value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
              <label className="block font-bold text-xs text-muted mb-1.5">Email</label>
              <input className="field mb-3" type="email" placeholder="Nhập email"
                value={email} onChange={e => setEmail(e.target.value)} />
              <label className="block font-bold text-xs text-muted mb-1.5">Mật khẩu</label>
              <input className="field mb-3" type="password" placeholder="Nhập mật khẩu"
                value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
              <label className="block font-bold text-xs text-muted mb-1.5">Xác nhận mật khẩu</label>
              <input className="field mb-3.5" type="password" placeholder="Nhập lại mật khẩu"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 shrink-0" />
                <span className="text-xs text-muted leading-relaxed">
                  Tôi đồng ý với{' '}
                  <Link href="/terms" target="_blank" className="text-blue font-bold">điều khoản sử dụng</Link>
                  {' '}của anyLEARN
                </span>
              </label>
              <button type="submit" className="btn btn--green w-full text-base py-3.5" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
              <p className="text-center mt-3.5 text-muted text-sm">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => switchTab('login')}
                  className="border-0 bg-transparent text-blue font-bold cursor-pointer font-[inherit]">
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
