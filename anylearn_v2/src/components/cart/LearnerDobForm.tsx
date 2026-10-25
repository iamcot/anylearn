'use client'

import { useState } from 'react'
import { UserIcon } from '@/components/icons'
import { checkFullDob, type LearnerNeedingDob } from '@/lib/checkout/learnerDob'

interface Props {
  learner: LearnerNeedingDob
  saving: boolean
  onSave: (dob: string) => void
}

const SELECT_CLASS = 'field min-h-11 w-full'
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)
const YEARS_BACK = 80

function yearOptions(knownYear: number | null, thisYear: number): number[] {
  const years = Array.from({ length: YEARS_BACK }, (_, index) => thisYear - index)
  return knownYear !== null && !years.includes(knownYear) ? [...years, knownYear].sort((a, b) => b - a) : years
}

// Checkout asks the full date of birth of whoever attends. The year they gave earlier is already filled in.
export default function LearnerDobForm({ learner, saving, onSave }: Props) {
  const [day, setDay] = useState(0)
  const [month, setMonth] = useState(0)
  const [year, setYear] = useState(learner.knownYear ?? 0)
  const [confirmedYear, setConfirmedYear] = useState(false)
  const [error, setError] = useState('')

  const today = new Date()
  const check = checkFullDob({ day, month, year }, learner.knownYear, today)
  const needsYearConfirm = check.ok && check.yearChanged

  const handleSave = () => {
    if (!check.ok) { setError(check.message); return }
    if (check.yearChanged && !confirmedYear) { setError(`Năm sinh khác với năm ${learner.knownYear} đã khai. Tích xác nhận nếu đúng.`); return }
    setError('')
    onSave(check.dob)
  }

  return (
    <div className="rounded-xl border border-warn-line bg-warn-soft p-3.5 text-left">
      <div className="mb-2.5 flex items-center gap-2 text-sm font-medium text-warn-text">
        <UserIcon className="size-4" />
        Ngày sinh của {learner.name}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select aria-label={`Ngày sinh của ${learner.name}: ngày`} value={day} onChange={event => setDay(Number(event.target.value))} className={SELECT_CLASS}>
          <option value={0}>Ngày</option>
          {DAYS.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label={`Ngày sinh của ${learner.name}: tháng`} value={month} onChange={event => setMonth(Number(event.target.value))} className={SELECT_CLASS}>
          <option value={0}>Tháng</option>
          {MONTHS.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label={`Ngày sinh của ${learner.name}: năm`} value={year} onChange={event => setYear(Number(event.target.value))} className={SELECT_CLASS}>
          <option value={0}>Năm</option>
          {yearOptions(learner.knownYear, today.getFullYear()).map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {needsYearConfirm && (
        <label className="mt-2.5 flex min-h-11 cursor-pointer items-start gap-2.5 text-xs text-warn-text">
          <input type="checkbox" checked={confirmedYear} onChange={event => setConfirmedYear(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-green" />
          <span>Năm {year} khác với năm {learner.knownYear} bạn đã khai trước đó. Tôi xác nhận ngày sinh này đúng.</span>
        </label>
      )}
      {error && <p role="alert" className="m-0 mt-2 text-xs text-red">{error}</p>}
      <button type="button" onClick={handleSave} disabled={saving} className="btn btn--green mt-3 w-full min-h-11 py-2.5 text-sm disabled:opacity-60">
        {saving ? 'Đang lưu...' : 'Lưu ngày sinh'}
      </button>
    </div>
  )
}
