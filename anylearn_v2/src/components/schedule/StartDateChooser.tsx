'use client'

import { useState } from 'react'
import FlexibleStartPicker from './FlexibleStartPicker'
import type { Enrollment } from '@/lib/schedule/calendar'

interface Props {
  enrollment: Enrollment
  /** Resolves to an error text, or null when saved. */
  onSave: (enrollmentId: number, day: string) => Promise<string | null>
  compact?: boolean
}

/** Account page: pick or change the start of a flexible class (allowed once, before the class starts). */
export default function StartDateChooser({ enrollment, onSave, compact }: Props) {
  const [day, setDay] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!day) return
    setSaving(true)
    setError('')
    const problem = await onSave(enrollment.id, day)
    setSaving(false)
    if (problem) setError(problem)
  }

  return (
    <div>
      <FlexibleStartPicker schedule={enrollment} value={day} onChange={setDay} compact={compact} />
      <p className="mb-0 mt-1 text-xs font-medium text-warn-text">Bạn chỉ chọn được 1 lần ở đây, hãy kiểm tra kỹ trước khi xác nhận.</p>
      {error && <p className="mb-0 mt-1 text-xs text-red">{error}</p>}
      <button type="button" onClick={save} disabled={!day || saving}
        className="mt-2.5 min-h-11 w-full cursor-pointer rounded-full border-0 bg-green px-4 text-sm font-bold text-white disabled:opacity-50 md:w-auto">
        {saving ? 'Đang lưu...' : 'Xác nhận ngày khai giảng'}
      </button>
    </div>
  )
}
