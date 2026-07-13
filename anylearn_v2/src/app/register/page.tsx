'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return }
    setLoading(true)
    const { error: err } = await register(name, phone, email, password)
    setLoading(false)
    if (err) { setError(err); return }
    router.push('/')
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', border: '1px solid #e6edf4', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color: '#17212f' }}>Đăng ký</h1>
        <p style={{ margin: '0 0 28px', color: '#6d7a8a' }}>Tạo tài khoản anyLEARN miễn phí</p>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#e73348', fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Họ và tên', type: 'text', value: name, onChange: setName, placeholder: 'Nhập họ và tên', required: true },
            { label: 'Số điện thoại', type: 'tel', value: phone, onChange: setPhone, placeholder: 'Nhập số điện thoại', required: true },
            { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'Nhập email (tùy chọn)', required: false },
            { label: 'Mật khẩu', type: 'password', value: password, onChange: setPassword, placeholder: 'Ít nhất 6 ký tự', required: true },
            { label: 'Xác nhận mật khẩu', type: 'password', value: confirm, onChange: setConfirm, placeholder: 'Nhập lại mật khẩu', required: true },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#6d7a8a', marginBottom: 5 }}>{f.label}</label>
              <input className="field" type={f.type} placeholder={f.placeholder} value={f.value}
                onChange={e => f.onChange(e.target.value)} required={f.required} />
            </div>
          ))}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, margin: '14px 0 22px', cursor: 'pointer' }}>
            <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#6d7a8a', lineHeight: 1.5 }}>
              Tôi đồng ý với{' '}
              <Link href="/terms" target="_blank" style={{ color: '#00539b', fontWeight: 700 }}>điều khoản sử dụng</Link>
              {' '}của anyLEARN
            </span>
          </label>

          <button type="submit" className="btn btn--green" style={{ width: '100%', fontSize: 16, padding: 14 }} disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, color: '#6d7a8a', fontSize: 14 }}>
          Đã có tài khoản?{' '}
          <Link href="/login" style={{ color: '#00539b', fontWeight: 700 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
