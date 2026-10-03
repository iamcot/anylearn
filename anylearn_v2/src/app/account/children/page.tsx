'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getChildren, saveChild, deleteChild, ChildUser } from '@/lib/api'

export default function ChildrenPage() {
  const { token } = useAuth()
  const [children, setChildren] = useState<ChildUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChild, setEditingChild] = useState<ChildUser | null>(null)
  const [form, setForm] = useState({ name: '', dob: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getChildren(token).then(data => { setChildren(data); setLoading(false) })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError('')
    const { data, error: err } = await saveChild(
      { id: editingChild?.id, name: form.name, dob: form.dob || undefined },
      token
    )
    setSaving(false)
    if (err || !data) { setError(err || 'Lỗi lưu thông tin'); return }
    if (editingChild) {
      setChildren(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      setChildren(prev => [...prev, data])
    }
    setShowForm(false)
    setEditingChild(null)
    setForm({ name: '', dob: '' })
  }

  const handleEdit = (child: ChildUser) => {
    setEditingChild(child)
    setForm({ name: child.name, dob: child.dob ?? '' })
    setShowForm(true)
  }

  const handleDelete = async (childId: number) => {
    if (!token) return
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return
    const { error: err } = await deleteChild(childId, token)
    if (err) { alert(err); return }
    setChildren(prev => prev.filter(c => c.id !== childId))
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingChild(null)
    setForm({ name: '', dob: '' })
    setError('')
  }

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="border-b border-line px-5 py-4 flex items-center justify-between">
        <h2 className="m-0 text-lg font-black text-ink">Tài khoản của con</h2>
        <button onClick={() => { setShowForm(true); setEditingChild(null); setForm({ name: '', dob: '' }) }}
          className="btn btn--green py-2 px-4 text-sm">
          + Thêm tài khoản
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-line bg-blue-soft">
          <h3 className="m-0 mb-4 text-sm font-black text-ink">
            {editingChild ? 'Chỉnh sửa' : 'Thêm tài khoản của con'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Tên *</label>
              <input className="field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Ngày sinh</label>
              <input className="field" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
          </div>
          {error && <div className="bg-red-soft border border-[#ffc9c9] rounded-xl px-3 py-2 mb-3 text-red text-xs">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" className="btn btn--green py-2 px-4 text-sm" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn--outline py-2 px-4 text-sm">Hủy</button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="p-5">
        {loading ? (
          <p className="text-muted text-sm">Đang tải...</p>
        ) : children.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">Chưa có tài khoản nào. Nhấn nút thêm để tạo.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {children.map(child => (
              <div key={child.id} className="flex items-center gap-3 p-3 border border-line rounded-xl">
                {child.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={child.image} alt={child.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-blue-soft grid place-items-center text-blue font-black shrink-0">
                      {child.name?.charAt(0).toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink text-sm">{child.name}</div>
                  {child.dob && <div className="text-xs text-muted">{new Date(child.dob).toLocaleDateString('vi-VN')}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(child)} className="text-xs text-blue font-bold border-0 bg-transparent cursor-pointer">Sửa</button>
                  <button onClick={() => handleDelete(child.id)} className="text-xs text-red font-bold border-0 bg-transparent cursor-pointer">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
