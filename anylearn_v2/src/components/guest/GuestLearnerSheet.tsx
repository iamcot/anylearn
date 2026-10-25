'use client'

import { useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { CHILD_MAX_AGE, MAX_GUEST_LEARNERS, MAX_NICKNAME_LENGTH, SELF_MAX_AGE, SELF_MIN_AGE } from '@/config/guestLearners'
import {
  EMPTY_GUEST_STORE, birthYearOptions, withAnswer, withDismissed, type GuestLearnerStore,
} from '@/lib/guest/guestLearners'
import { closeGuestSheet, getGuestStore, saveGuestStore } from './guestLearnerStore'

type Step = 'ask' | 'child' | 'self'

interface Row {
  localId: string
  nickname: string
  birthYear: number
}

const FIELD_CLASS = 'field min-h-11 w-full'
const CHOICE_CLASS = 'min-h-12 w-full cursor-pointer rounded-full border border-blue bg-white px-4 text-[15px] font-medium text-blue hover:bg-blue-soft'

function newLocalId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function blankRow(): Row {
  return { localId: newLocalId(), nickname: '', birthYear: 0 }
}

function initialRows(store: GuestLearnerStore): Row[] {
  return store.learners.length > 0 ? store.learners.map(learner => ({ ...learner })) : [blankRow()]
}

function YearSelect({ label, value, years, onChange }: { label: string; value: number; years: number[]; onChange: (year: number) => void }) {
  return (
    <select aria-label={label} value={value} onChange={event => onChange(Number(event.target.value))} className={FIELD_CLASS}>
      <option value={0}>Năm sinh</option>
      {years.map(year => <option key={year} value={year}>{year}</option>)}
    </select>
  )
}

function AskStep({ onPick, onLater }: { onPick: (step: Step) => void; onLater: () => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      <button type="button" onClick={() => onPick('child')} className={CHOICE_CLASS}>Cho con</button>
      <button type="button" onClick={() => onPick('self')} className={CHOICE_CLASS}>Cho bản thân</button>
      <button type="button" onClick={onLater} className="min-h-11 cursor-pointer border-0 bg-transparent text-sm font-medium text-muted">Để sau</button>
    </div>
  )
}

function ChildStep({ store, onSaved }: { store: GuestLearnerStore; onSaved: () => void }) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(store))
  const [error, setError] = useState('')
  const years = birthYearOptions(new Date(), 0, CHILD_MAX_AGE)

  const patch = (localId: string, change: Partial<Row>) =>
    setRows(prev => prev.map(row => (row.localId === localId ? { ...row, ...change } : row)))

  const handleSave = () => {
    const filled = rows.map(row => ({ ...row, nickname: row.nickname.trim() }))
    if (filled.some(row => !row.nickname || !row.birthYear)) { setError('Nhập tên (hoặc biệt danh) và chọn năm sinh cho từng bé'); return }
    saveGuestStore(withAnswer(getGuestStore(), { audience: 'child', learners: filled }))
    onSaved()
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={row.localId} className="flex items-start gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_7.5rem] gap-2">
            <input
              value={row.nickname}
              maxLength={MAX_NICKNAME_LENGTH}
              onChange={event => patch(row.localId, { nickname: event.target.value })}
              placeholder="Tên hoặc biệt danh"
              aria-label={`Tên bé ${index + 1}`}
              autoComplete="off"
              className={FIELD_CLASS}
            />
            <YearSelect label={`Năm sinh bé ${index + 1}`} value={row.birthYear} years={years} onChange={year => patch(row.localId, { birthYear: year })} />
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              aria-label={`Bỏ bé ${index + 1}`}
              onClick={() => setRows(prev => prev.filter(item => item.localId !== row.localId))}
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:text-red"
            >
              <CloseIcon className="size-5" />
            </button>
          )}
        </div>
      ))}
      {rows.length < MAX_GUEST_LEARNERS && (
        <button
          type="button"
          onClick={() => setRows(prev => [...prev, blankRow()])}
          className="min-h-11 cursor-pointer self-start rounded-full border-0 bg-transparent px-1 text-sm font-medium text-blue"
        >
          + Thêm bé
        </button>
      )}
      {error && <p role="alert" className="m-0 text-xs text-red">{error}</p>}
      <button type="button" onClick={handleSave} className="btn btn--green w-full min-h-12 py-3 text-[15px]">Lưu</button>
    </div>
  )
}

function SelfStep({ store, onSaved }: { store: GuestLearnerStore; onSaved: () => void }) {
  const [year, setYear] = useState(store.selfBirthYear ?? 0)
  const years = birthYearOptions(new Date(), SELF_MIN_AGE, SELF_MAX_AGE)

  const handleSave = () => {
    saveGuestStore(withAnswer(getGuestStore(), { audience: 'self', learners: [], selfBirthYear: year || undefined }))
    onSaved()
  }

  return (
    <div className="flex flex-col gap-3">
      <YearSelect label="Năm sinh của bạn (không bắt buộc)" value={year} years={years} onChange={setYear} />
      <p className="m-0 text-xs text-muted">Năm sinh giúp gợi ý khóa học hợp độ tuổi. Bạn có thể bỏ trống.</p>
      <button type="button" onClick={handleSave} className="btn btn--green w-full min-h-12 py-3 text-[15px]">Lưu</button>
    </div>
  )
}

const TITLES: Record<Step, string> = {
  ask: 'Bạn đang tìm khóa học cho ai?',
  child: 'Bé nhà bạn tên gì, sinh năm nào?',
  self: 'Bạn sinh năm nào?',
}

// Light bottom sheet, no dark overlay: the visitor can keep scrolling. Mounted only while shown, so its form always
// starts from what is saved.
export default function GuestLearnerSheet({ store, asking }: { store: GuestLearnerStore; asking: boolean }) {
  const [step, setStep] = useState<Step>(store.audience ?? 'ask')
  const hasSaved = store.audience !== undefined

  const later = () => {
    saveGuestStore(withDismissed(getGuestStore(), new Date()))
    closeGuestSheet()
  }

  // "Xoá thông tin" must not make the question pop up again at once, so it counts as "Để sau".
  const forget = () => {
    saveGuestStore(withDismissed(EMPTY_GUEST_STORE, new Date()))
    closeGuestSheet()
  }

  const close = asking && !hasSaved ? later : closeGuestSheet

  return (
    <div
      role="dialog"
      aria-label={TITLES[step]}
      className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl border border-line bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-raised lg:inset-x-auto lg:bottom-6 lg:right-6 lg:mx-0 lg:w-[400px] lg:rounded-3xl"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="m-0 text-base font-extrabold text-ink">{TITLES[step]}</h2>
        <button type="button" aria-label="Đóng" onClick={close} className="-mr-2 -mt-1 grid size-11 shrink-0 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink">
          <CloseIcon />
        </button>
      </div>
      {step === 'ask' && <AskStep onPick={setStep} onLater={later} />}
      {step === 'child' && <ChildStep store={store} onSaved={closeGuestSheet} />}
      {step === 'self' && <SelfStep store={store} onSaved={closeGuestSheet} />}
      {hasSaved && (
        <button type="button" onClick={forget} className="mt-1 min-h-11 w-full cursor-pointer border-0 bg-transparent text-xs text-muted underline">
          Xoá thông tin đã nhập
        </button>
      )}
    </div>
  )
}
