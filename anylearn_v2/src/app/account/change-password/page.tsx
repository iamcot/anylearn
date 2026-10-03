'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { changePassword } from '@/lib/api'

export default function ChangePasswordPage() {
  const { token } = useAuth()
  const [form, setForm] = useState({ oldPass: '', newPass: '', confirmPass: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPass !== form.confirmPass) { setError('Mật khẩu mới không khớp'); return }
    if (form.newPass.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    if (!token) return
    setLoading(true)
    setError('')
    const { error: err } = await changePassword(form.oldPass, form.newPass, token)
    setLoading(false)
    if (err) { setError(err); return }
    setSuccess(true)
    setForm({ oldPass: '', newPass: '', confirmPass: '' })
  }

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="m-0 text-lg font-black text-ink">Đổi mật khẩu</h2>
      </div>

      <div className="p-5 max-w-md">
        {success && (
          <div className="bg-green-soft border border-green rounded-xl px-4 py-3 mb-4 text-green-dark text-sm font-bold">
            ✓ Đổi mật khẩu thành công!
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Mật khẩu hiện tại</label>
            <input className="field" type="password" placeholder="Nhập mật khẩu hiện tại"
              value={form.oldPass} onChange={e => setForm(f => ({ ...f, oldPass: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Mật khẩu mới</label>
            <input className="field" type="password" placeholder="Ít nhất 6 ký tự"
              value={form.newPass} onChange={e => setForm(f => ({ ...f, newPass: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Nhắc lại mật khẩu mới</label>
            <input className="field" type="password" placeholder="Nhập lại mật khẩu mới"
              value={form.confirmPass} onChange={e => setForm(f => ({ ...f, confirmPass: e.target.value }))} required />
          </div>

          {error && <div className="bg-red-soft border border-[#ffc9c9] rounded-xl px-3.5 py-2.5 text-red text-sm">{error}</div>}

          <button type="submit" className="btn btn--green py-3 px-8 w-fit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}
