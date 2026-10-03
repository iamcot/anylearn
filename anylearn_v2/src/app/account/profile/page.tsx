'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { updateProfile, updateImageUrl, getMyProfile, UserProfile } from '@/lib/api'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'
const ROLES_WITH_FULL_CONTENT = ['school', 'teacher']

export default function ProfilePage() {
  const { token, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Fetch full profile from API on mount (authUser in localStorage doesn't have address/dob/sex/etc.)
  useEffect(() => {
    if (!token) return
    getMyProfile(token).then(data => { if (data) setProfile(data) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
    // Sync AuthContext so Header + other components see updated name/image
    updateUser({ name: data.name, image: data.image })
    setSuccess('Đã lưu thành công!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    setError('')
    try {
      // Upload file to backend (multipart → S3)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${BASE}/user/upload-image/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await res.json()
      if (json?.resultCode !== 1 || !json?.data?.image) {
        setError(json?.message || 'Upload ảnh thất bại')
        return
      }
      const newUrl: string = json.data.image
      setProfile(p => p ? { ...p, image: newUrl } : p)
      updateUser({ image: newUrl })
      setSuccess('Đã cập nhật ảnh đại diện!')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Không thể upload ảnh')
    } finally {
      setUploading(false)
    }
  }

  if (!profile) return <div className="text-muted text-sm">Đang tải...</div>

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="m-0 text-lg font-black text-ink">Thông tin cá nhân</h2>
      </div>

      <form onSubmit={handleSave} className="p-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-line">
          {profile.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.image} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-line" />
            : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue to-green grid place-items-center text-white font-black text-2xl shrink-0">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
          }
          <div>
            <label className="btn btn--outline py-2 px-4 text-sm cursor-pointer">
              {uploading ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <p className="text-xs text-muted mt-1">JPG, PNG tối đa 2MB</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Họ và tên *</label>
            <input className="field" value={profile.name} onChange={e => setProfile(p => p ? { ...p, name: e.target.value } : p)} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Số điện thoại</label>
            <input className="field bg-bg cursor-not-allowed opacity-60" value={profile.phone} disabled />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Email</label>
            <input className="field" type="email" value={profile.email ?? ''} onChange={e => setProfile(p => p ? { ...p, email: e.target.value } : p)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Chức danh</label>
            <input className="field" value={profile.title ?? ''} onChange={e => setProfile(p => p ? { ...p, title: e.target.value } : p)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Ngày sinh</label>
            <input className="field" type="date" value={profile.dob ?? ''} onChange={e => setProfile(p => p ? { ...p, dob: e.target.value } : p)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Giới tính</label>
            <select className="field" value={profile.sex ?? ''} onChange={e => setProfile(p => p ? { ...p, sex: e.target.value } : p)}>
              <option value="">Không chọn</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-muted mb-1.5">Địa chỉ</label>
            <input className="field" value={profile.address ?? ''} onChange={e => setProfile(p => p ? { ...p, address: e.target.value } : p)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-muted mb-1.5">Giới thiệu ngắn</label>
            <textarea className="field min-h-[80px]" value={profile.introduce ?? ''} onChange={e => setProfile(p => p ? { ...p, introduce: e.target.value } : p)} />
          </div>
          {profile.role && ROLES_WITH_FULL_CONTENT.includes(profile.role) && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-muted mb-1.5">Giới thiệu đầy đủ</label>
              <textarea className="field min-h-[160px]" value={profile.fullContent ?? ''} onChange={e => setProfile(p => p ? { ...p, fullContent: e.target.value } : p)} />
            </div>
          )}
        </div>

        {error && <div className="mt-4 bg-red-soft border border-[#ffc9c9] rounded-xl px-3.5 py-2.5 text-red text-sm">{error}</div>}
        {success && <div className="mt-4 bg-green-soft border border-green rounded-xl px-3.5 py-2.5 text-green-dark text-sm">{success}</div>}

        <div className="mt-6">
          <button type="submit" className="btn btn--green py-3 px-8" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </div>
  )
}
