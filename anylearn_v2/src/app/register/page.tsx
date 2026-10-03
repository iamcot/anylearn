'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FIELDS = [
  { label: 'Họ và tên', type: 'text', key: 'name', placeholder: 'Nhập họ và tên', required: true },
  { label: 'Số điện thoại', type: 'tel', key: 'phone', placeholder: 'Nhập số điện thoại', required: true },
  { label: 'Email', type: 'email', key: 'email', placeholder: 'Nhập email (tùy chọn)', required: false },
  { label: 'Mật khẩu', type: 'password', key: 'password', placeholder: 'Ít nhất 6 ký tự', required: true },
  { label: 'Xác nhận mật khẩu', type: 'password', key: 'confirm', placeholder: 'Nhập lại mật khẩu', required: true },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [values, setValues] = useState({ name: '', phone: '', email: '', password: '', confirm: '' })
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (values.password !== values.confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (!agreedTerms) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return }
    setLoading(true)
    const { error: err } = await register(values.name, values.phone, values.email, values.password)
    setLoading(false)
    if (err) { setError(err); return }
    router.push('/')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-5">
      <div className="bg-white border border-line rounded-3xl px-9 py-10 w-full max-w-[440px] shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <h1 className="m-0 mb-2 text-[28px] font-black text-ink">Đăng ký</h1>
        <p className="m-0 mb-7 text-muted">Tạo tài khoản anyLEARN miễn phí</p>

        {error && <div className="bg-red-soft border border-[#ffc9c9] rounded-xl px-3.5 py-2.5 mb-4 text-red text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          {FIELDS.map(f => (
            <div key={f.key} className="mb-3">
              <label className="block font-bold text-xs text-muted mb-1.5">{f.label}</label>
              <input className="field" type={f.type} placeholder={f.placeholder}
                value={values[f.key as keyof typeof values]}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                required={f.required} />
            </div>
          ))}

          <label className="flex items-start gap-2.5 mt-3.5 mb-5 cursor-pointer">
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
        </form>

        <p className="text-center mt-4 text-muted text-sm">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue font-bold">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
