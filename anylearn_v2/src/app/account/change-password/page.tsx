'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { changePassword } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'
import { CheckIcon } from '@/components/icons'

const MIN_PASSWORD_LENGTH = 6

export default function ChangePasswordPage() {
  const { token } = useAuth()
  const [form, setForm] = useState({ oldPass: '', newPass: '', confirmPass: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const setField = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form.newPass !== form.confirmPass) { setError('Mật khẩu mới không khớp'); return }
    if (form.newPass.length < MIN_PASSWORD_LENGTH) { setError(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`); return }
    if (!token) return
    setLoading(true)
    setError('')
    setSuccess(false)
    const { error: err } = await changePassword(form.oldPass, form.newPass, token)
    setLoading(false)
    if (err) { setError(err); return }
    setSuccess(true)
    setForm({ oldPass: '', newPass: '', confirmPass: '' })
  }

  return (
    <AccountCard title="Đổi mật khẩu">
      <div className="max-w-md p-4 sm:p-5">
        {success && (
          <Alert kind="success" className="mb-4 flex items-center gap-2 font-bold">
            <CheckIcon className="size-5" />Đổi mật khẩu thành công!
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Mật khẩu hiện tại">
            <input className="field" type="password" placeholder="Nhập mật khẩu hiện tại" autoComplete="current-password" value={form.oldPass} onChange={setField('oldPass')} required />
          </FormField>
          <FormField label="Mật khẩu mới">
            <input className="field" type="password" placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`} autoComplete="new-password" value={form.newPass} onChange={setField('newPass')} required />
          </FormField>
          <FormField label="Nhắc lại mật khẩu mới">
            <input className="field" type="password" placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" value={form.confirmPass} onChange={setField('confirmPass')} required />
          </FormField>

          {error && <Alert kind="error">{error}</Alert>}

          <button type="submit" className="btn btn--green w-fit px-8 py-3" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </AccountCard>
  )
}
