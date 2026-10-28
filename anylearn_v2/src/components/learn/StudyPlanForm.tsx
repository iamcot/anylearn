'use client'

import { useEffect, useState } from 'react'
import { deleteStudyPlan, getStudyPlan, saveStudyPlan, type StudyPlan } from '@/lib/api/learn'
import { planText, toggleDay, WEEKDAYS } from '@/lib/learn/rules'
import { CalendarIcon } from '@/components/icons'

/**
 * "Lịch tự học" of one learner and course: weekdays + a time (+ lessons per session). At that time the account gets a
 * reminder (bell + push) unless the learner already studied that day.
 */
export default function StudyPlanForm({ token, learnerId, itemId, onSaved }: { token: string; learnerId: number; itemId: number; onSaved?: (plan: StudyPlan | null) => void }) {
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [editing, setEditing] = useState(false)
  const [days, setDays] = useState<number[]>([])
  const [time, setTime] = useState('20:00')
  const [per, setPer] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getStudyPlan(token, learnerId, itemId).then(res => {
      if (cancelled) return
      const p = res.data && 'weekdays' in res.data ? (res.data as StudyPlan) : null
      setPlan(p)
      if (p) { setDays(p.weekdays); setTime(p.time ?? '20:00'); setPer(p.lessonsPerSession) }
    })
    return () => { cancelled = true }
  }, [token, learnerId, itemId])

  const save = async () => {
    setBusy(true)
    setError(null)
    const res = await saveStudyPlan(token, { learnerId, itemId, weekdays: days, time, lessonsPerSession: per, enabled: true })
    setBusy(false)
    if (res.error || !res.data) return setError(res.error ?? 'Không lưu được')
    setPlan(res.data)
    setEditing(false)
    onSaved?.(res.data)
  }

  const remove = async () => {
    setBusy(true)
    await deleteStudyPlan(token, learnerId, itemId)
    setBusy(false)
    setPlan(null)
    setEditing(false)
    onSaved?.(null)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-line bg-white p-3">
        <CalendarIcon className="size-5 shrink-0 text-green" />
        <div className="min-w-0 flex-1 text-sm">
          {plan ? (
            <><div className="font-bold text-ink">Lịch tự học: {plan.text ?? planText(plan.weekdays, plan.time)}</div>
              <div className="text-xs text-muted">{plan.lessonsPerSession} bài mỗi buổi · anyLEARN nhắc đúng giờ nếu hôm đó chưa học</div></>
          ) : (
            <><div className="font-bold text-ink">Đặt lịch tự học</div>
              <div className="text-xs text-muted">Chọn ngày và giờ, anyLEARN sẽ nhắc để không bỏ dở khóa học</div></>
          )}
        </div>
        <button type="button" onClick={() => setEditing(true)} className="btn btn--outline shrink-0 px-3 py-1.5 text-xs">{plan ? 'Sửa' : 'Đặt lịch'}</button>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-line bg-white p-4">
      <div className="mb-2 text-sm font-bold text-ink">Học vào những ngày</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {WEEKDAYS.map(d => (
          <button key={d.value} type="button" onClick={() => setDays(toggleDay(days, d.value))}
            className={`min-w-11 rounded-full border px-3 py-1.5 text-sm font-bold ${days.includes(d.value) ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-muted'}`}>
            {d.short}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="text-sm font-bold text-ink">Giờ học
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="field mt-1 block w-32" />
        </label>
        <label className="text-sm font-bold text-ink">Số bài mỗi buổi
          <select value={per} onChange={e => setPer(Number(e.target.value))} className="field mt-1 block w-24">
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="mb-3 text-sm text-red">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={busy} className="btn btn--green py-2 text-sm">Lưu lịch</button>
        <button type="button" onClick={() => setEditing(false)} className="btn btn--outline py-2 text-sm">Hủy</button>
        {plan && <button type="button" onClick={remove} disabled={busy} className="ml-auto text-sm font-semibold text-red">Xóa lịch</button>}
      </div>
    </div>
  )
}
