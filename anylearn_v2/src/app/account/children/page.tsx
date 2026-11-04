'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getChildren, saveChild, deleteChild, type ChildUser } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import ChildInterestsModal from '@/components/ChildInterestsModal'
import ChildFormModal, { type ChildDraft } from '@/components/ChildFormModal'
import TierChip from '@/components/learnertier/TierChip'
import { getLearnerTiers, type LearnerTier } from '@/lib/api/gamification'
import { ListSkeleton } from '@/components/PageSkeleton'
import { useToast } from '@/components/ToastProvider'

const CONFIRM_DELETE_MS = 4000
const TEXT_BUTTON = 'min-h-11 cursor-pointer border-0 bg-transparent px-2 text-xs font-bold'

export default function ChildrenPage() {
  const { token, user } = useAuth()
  const toast = useToast()
  const [children, setChildren] = useState<ChildUser[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<ChildDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [interestsFor, setInterestsFor] = useState<ChildUser | null>(null)
  const [selfInterests, setSelfInterests] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)
  const [tiers, setTiers] = useState<Map<number, LearnerTier>>(new Map())

  useEffect(() => {
    if (!token) return
    getChildren(token).then(data => { setChildren(data); setLoading(false) })
    getLearnerTiers(token).then(data => {
      if (data?.enabled) setTiers(new Map(data.learners.map(l => [l.learnerId, l])))
    })
  }, [token])

  useEffect(() => {
    if (confirmingDeleteId === null) return
    const timer = setTimeout(() => setConfirmingDeleteId(null), CONFIRM_DELETE_MS)
    return () => clearTimeout(timer)
  }, [confirmingDeleteId])

  const handleSave = async (values: ChildDraft) => {
    if (!token) return
    setSaving(true)
    const { data, error } = await saveChild({ id: values.id, name: values.name, dob: values.dob || undefined }, token)
    setSaving(false)
    if (error || !data) { toast({ kind: 'error', text: error || 'Lỗi lưu thông tin' }); return }
    setChildren(prev => (values.id ? prev.map(child => (child.id === data.id ? data : child)) : [...prev, data]))
    setDraft(null)
    // A new child gets the optional survey right away; it can be skipped and reopened with "Sở thích".
    if (!values.id) setInterestsFor(data)
  }

  const handleDelete = async (childId: number) => {
    if (!token) return
    if (confirmingDeleteId !== childId) { setConfirmingDeleteId(childId); return }
    setConfirmingDeleteId(null)
    const { error } = await deleteChild(childId, token)
    if (error) { toast({ kind: 'error', text: error }); return }
    setChildren(prev => prev.filter(child => child.id !== childId))
    toast({ kind: 'success', text: 'Đã xoá tài khoản' })
  }

  return (
    <AccountCard
      title="Quản lý người học"
      action={<button type="button" onClick={() => setDraft({ name: '', dob: '' })} className="btn btn--green min-h-11 px-4 py-2 text-sm">+ Thêm bé</button>}
    >
      {draft && <ChildFormModal initial={draft} saving={saving} dobRequired={false} onSave={handleSave} onClose={() => setDraft(null)} />}

      {interestsFor && token && (
        <ChildInterestsModal
          childId={interestsFor.id}
          childName={interestsFor.name}
          token={token}
          onClose={() => setInterestsFor(null)}
          onSaved={() => { setInterestsFor(null); toast({ kind: 'success', text: 'Đã lưu sở thích' }) }}
        />
      )}

      {selfInterests && token && user && (
        <ChildInterestsModal
          childId={user.id}
          childName={user.name}
          token={token}
          isSelf
          onClose={() => setSelfInterests(false)}
          onSaved={() => { setSelfInterests(false); toast({ kind: 'success', text: 'Đã lưu sở thích' }) }}
        />
      )}

      <div className="p-4 sm:p-5">
        {loading ? (
          <ListSkeleton showTitle={false} />
        ) : (
          <div className="flex flex-col gap-3">
            {user && (
              <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                {user.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.image} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                  : <div className="grid size-10 shrink-0 place-items-center rounded-full bg-green-soft font-extrabold text-green">{user.name?.charAt(0).toUpperCase()}</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold text-ink">{user.name} (bạn)</span>
                    <TierChip tier={tiers.get(user.id)} />
                  </div>
                  {(tiers.get(user.id)?.finished ?? 0) > 0 && <div className="text-xs text-muted">{tiers.get(user.id)!.finished} khóa đã xong</div>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setSelfInterests(true)} className={`${TEXT_BUTTON} text-green-dark`}>Sở thích</button>
                  <Link href="/account/profile" className={`${TEXT_BUTTON} inline-flex items-center text-blue no-underline`}>Sửa</Link>
                </div>
              </div>
            )}
            {children.length === 0 && <p className="m-0 py-4 text-center text-sm text-muted">Chưa có bé nào. Nhấn &quot;+ Thêm bé&quot; để tạo.</p>}
            {children.map(child => (
              <div key={child.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                {child.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={child.image} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                  : <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-soft font-extrabold text-blue">{child.name?.charAt(0).toUpperCase()}</div>
                }
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Link href={`/account/children/${child.id}`} className="text-sm font-bold text-ink no-underline hover:underline">{child.name}</Link>
                    <TierChip tier={tiers.get(child.id)} />
                  </div>
                  {child.dob && <div className="text-xs text-muted">{new Date(child.dob).toLocaleDateString('vi-VN')}</div>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setInterestsFor(child)} className={`${TEXT_BUTTON} text-green-dark`}>Sở thích</button>
                  <button type="button" onClick={() => setDraft({ id: child.id, name: child.name, dob: child.dob ?? '' })} className={`${TEXT_BUTTON} text-blue`}>Sửa</button>
                  <button type="button" onClick={() => handleDelete(child.id)} className={`${TEXT_BUTTON} text-red`}>
                    {confirmingDeleteId === child.id ? 'Bấm lần nữa để xoá' : 'Xóa'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountCard>
  )
}
