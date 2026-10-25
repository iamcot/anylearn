'use client'

import { useState } from 'react'
import Modal from '@/components/Modal'

export interface ChildDraft {
  id?: number
  name: string
  dob: string
}

interface Props {
  initial: ChildDraft
  saving: boolean
  onSave: (draft: ChildDraft) => void
  onClose: () => void
}

export default function ChildFormModal({ initial, saving, onSave, onClose }: Props) {
  const [name, setName] = useState(initial.name)
  const [dob, setDob] = useState(initial.dob)
  const canSave = !saving && name.trim() !== '' && dob !== ''

  return (
    <Modal title={initial.id ? 'Sửa tài khoản con' : 'Thêm tài khoản con'} onClose={onClose} maxWidth="max-w-[360px]">
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Tên</span>
          <input value={name} onChange={event => setName(event.target.value)} className="field w-full" placeholder="Tên học sinh" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Ngày sinh</span>
          <input type="date" value={dob} onChange={event => setDob(event.target.value)} className="field w-full" />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="btn btn--outline flex-1 text-sm">Hủy</button>
        <button
          type="button"
          onClick={() => onSave({ id: initial.id, name: name.trim(), dob })}
          disabled={!canSave}
          className="btn btn--green flex-1 text-sm disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </Modal>
  )
}
