'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { updateProfile, getMyProfile, type UserProfile } from '@/lib/api'
import { API_BASE } from '@/lib/apiBase'
import AccountCard from '@/components/account/AccountCard'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'
import { ListSkeleton } from '@/components/PageSkeleton'

const ROLES_WITH_FULL_CONTENT = ['school', 'teacher']
const NOTICE_DURATION_MS = 3000

export default function ProfilePage() {
  const { token, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // The user in localStorage lacks address, dob, sex..., so load the full profile.
  useEffect(() => {
    if (!token) return
    getMyProfile(token).then(data => { if (data) setProfile(data) })
  }, [token])

  const patch = (changes: Partial<UserProfile>) => setProfile(prev => (prev ? { ...prev, ...changes } : prev))

  const showSuccess = (text: string) => {
    setSuccess(text)
    setTimeout(() => setSuccess(''), NOTICE_DURATION_MS)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token || !profile) return
    setSaving(true)
    setError('')
    const { data, error: err } = await updateProfile({
      name: profile.name,
      email: profile.email,
      introduce: profile.introduce,
      address: profile.address,
      title: profile.title,
      fullContent: profile.fullContent,
      dob: profile.dob,
      sex: profile.sex,
    }, token)
    setSaving(false)
    if (err || !data) { setError(err || 'Lỗi lưu thông tin'); return }
    setProfile(data)
    updateUser({ name: data.name, image: data.image })
    showSuccess('Đã lưu thành công!')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_BASE}/user/upload-image/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await response.json()
      if (json?.resultCode !== 1 || !json?.data?.image) {
        setError(json?.message || 'Upload ảnh thất bại')
        return
      }
      const newUrl: string = json.data.image
      patch({ image: newUrl })
      updateUser({ image: newUrl })
      showSuccess('Đã cập nhật ảnh đại diện!')
    } catch {
      setError('Không thể upload ảnh')
    } finally {
      setUploading(false)
    }
  }

  if (!profile) return <ListSkeleton />

  return (
    <AccountCard title="Thông tin cá nhân">
      <form onSubmit={handleSave} className="p-4 sm:p-5">
        <div className="mb-6 flex items-center gap-4 border-b border-line pb-6">
          {profile.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.image} alt={profile.name} className="size-20 rounded-full border-2 border-line object-cover" />
            : (
              <div className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue to-green text-2xl font-extrabold text-white">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )
          }
          <div>
            <label className="btn btn--outline min-h-11 cursor-pointer px-4 py-2 text-sm">
              {uploading ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <p className="mb-0 mt-1 text-xs text-muted">JPG, PNG tối đa 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Họ và tên *">
            <input className="field" value={profile.name} onChange={e => patch({ name: e.target.value })} required />
          </FormField>
          <FormField label="Số điện thoại">
            <input className="field cursor-not-allowed bg-bg opacity-60" value={profile.phone} disabled />
          </FormField>
          <FormField label="Email">
            <input className="field" type="email" value={profile.email ?? ''} onChange={e => patch({ email: e.target.value })} />
          </FormField>
          <FormField label="Chức danh">
            <input className="field" value={profile.title ?? ''} onChange={e => patch({ title: e.target.value })} />
          </FormField>
          <FormField label="Ngày sinh">
            <input className="field" type="date" value={profile.dob ?? ''} onChange={e => patch({ dob: e.target.value })} />
          </FormField>
          <FormField label="Giới tính">
            <select className="field" value={profile.sex ?? ''} onChange={e => patch({ sex: e.target.value })}>
              <option value="">Không chọn</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </FormField>
          <FormField label="Địa chỉ" className="md:col-span-2">
            <input className="field" value={profile.address ?? ''} onChange={e => patch({ address: e.target.value })} />
          </FormField>
          <FormField label="Giới thiệu ngắn" className="md:col-span-2">
            <textarea className="field min-h-[80px] py-2" value={profile.introduce ?? ''} onChange={e => patch({ introduce: e.target.value })} />
          </FormField>
          {profile.role && ROLES_WITH_FULL_CONTENT.includes(profile.role) && (
            <FormField label="Giới thiệu đầy đủ" className="md:col-span-2">
              <textarea className="field min-h-[160px] py-2" value={profile.fullContent ?? ''} onChange={e => patch({ fullContent: e.target.value })} />
            </FormField>
          )}
        </div>

        {error && <Alert kind="error" className="mt-4">{error}</Alert>}
        {success && <Alert kind="success" className="mt-4">{success}</Alert>}

        <div className="mt-6">
          <button type="submit" className="btn btn--green px-8 py-3" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </AccountCard>
  )
}
