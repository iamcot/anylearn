'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMeChild, saveChild, type MeChild } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import ChildFormModal, { type ChildDraft } from '@/components/ChildFormModal'
import ChildInterestsModal from '@/components/ChildInterestsModal'
import { ListSkeleton } from '@/components/PageSkeleton'
import { useToast } from '@/components/ToastProvider'
import { getCourseUrl } from '@/lib/api'

const ACTION = 'inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-bold text-text no-underline hover:bg-bg'

const STATUS_LABEL: Record<string, string> = { active: 'Đang học', pending: 'Chờ bắt đầu', completed: 'Đã hoàn thành', cancelled: 'Đã hủy' }

function formatDob(child: MeChild): string {
  if (!child.dob) return 'Chưa có ngày sinh'
  const date = new Date(child.dob)
  return child.dobYearOnly ? `Sinh năm ${date.getFullYear()}` : date.toLocaleDateString('vi-VN')
}

export default function ChildPage() {
  const { token } = useAuth()
  const toast = useToast()
  const childId = Number(useParams<{ id: string }>().id)
  const [child, setChild] = useState<MeChild | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ChildDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)

  const load = useCallback(() => {
    if (!token) return
    getMeChild(childId, token).then(data => { setChild(data); setLoading(false) })
  }, [token, childId])

  useEffect(load, [load])

  const handleSave = async (values: ChildDraft) => {
    if (!token) return
    setSaving(true)
    const { error } = await saveChild({ id: values.id, name: values.name, dob: values.dob || undefined }, token)
    setSaving(false)
    if (error) { toast({ kind: 'error', text: error }); return }
    setEditing(null)
    load()
  }

  if (loading) return <AccountCard title="Tài khoản của con"><div className="p-5"><ListSkeleton showTitle={false} /></div></AccountCard>
  if (!child) {
    return (
      <AccountCard title="Tài khoản của con">
        <p className="m-0 p-5 text-sm text-muted">Không tìm thấy tài khoản này. <Link href="/account/children">Xem danh sách các bé</Link></p>
      </AccountCard>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <AccountCard title={child.name} subtitle={formatDob(child)}>
        <div className="flex flex-wrap gap-2 p-4 sm:p-5">
          <button type="button" className={`${ACTION} cursor-pointer`}
            onClick={() => setEditing({ id: child.id, name: child.name, dob: child.dobYearOnly ? '' : child.dob ?? '' })}>Sửa thông tin</button>
          <button type="button" className={`${ACTION} cursor-pointer`} onClick={() => setInterestsOpen(true)}>Sở thích</button>
          <Link href={`/account/orders?child=${child.id}`} className={ACTION}>Đơn hàng ({child.orderCount})</Link>
          <Link href="/account/schedule" className={ACTION}>Lịch học</Link>
        </div>
        {(!child.dob || child.dobYearOnly) && (
          <p className="m-0 border-t border-line bg-yellow/10 px-4 py-3 text-sm text-ink sm:px-5">
            Bé chưa có ngày sinh đầy đủ. Bạn cần bổ sung trước khi thanh toán khóa học.
          </p>
        )}
      </AccountCard>

      <AccountCard title="Khóa học của bé">
        {child.courses.length === 0 ? (
          <p className="m-0 p-5 text-sm text-muted">Bé chưa đăng ký khóa học nào.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {child.courses.map((course, index) => (
              <li key={`${course.itemId}-${index}`} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 sm:px-5">
                <Link href={getCourseUrl({ id: course.itemId, title: course.title })} className="min-w-0 flex-1 text-sm font-bold text-ink no-underline hover:underline">
                  {course.title}
                </Link>
                <span className="shrink-0 text-xs text-muted">{STATUS_LABEL[course.status] ?? course.status}</span>
              </li>
            ))}
          </ul>
        )}
      </AccountCard>

      {editing && <ChildFormModal initial={editing} saving={saving} dobRequired={false} onSave={handleSave} onClose={() => setEditing(null)} />}
      {interestsOpen && token && (
        <ChildInterestsModal childId={child.id} childName={child.name} token={token}
          onClose={() => setInterestsOpen(false)}
          onSaved={() => { setInterestsOpen(false); toast({ kind: 'success', text: 'Đã lưu sở thích' }) }} />
      )}
    </div>
  )
}
