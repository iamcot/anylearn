'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getLearnerTiers, markCourseFinished, type LearnerTier, type LearnerTierSummary } from '@/lib/api/gamification'
import { nudgeJourneyClaim } from '@/lib/journey/store'
import { useToast } from '@/components/ToastProvider'
import AccountCard from '@/components/account/AccountCard'

function Learner({ learner, tiers, onMark, busy }: { learner: LearnerTier; tiers: LearnerTierSummary['tiers']; onMark: (id: number) => void; busy: number | null }) {
  const [showMark, setShowMark] = useState(false)
  const next = tiers[learner.level + 1]
  const pct = next ? Math.round(Math.min(1, (learner.finished - tiers[learner.level].min) / Math.max(1, next.min - tiers[learner.level].min)) * 100) : 100
  return (
    <li className="border-t border-line px-5 py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-green-soft text-2xl" aria-hidden>{learner.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-ink">{learner.name} · <span className="text-green">{learner.label}</span></div>
          <div className="text-xs text-muted">
            {learner.finished} khóa đã hoàn thành{learner.nextLabel ? ` · còn ${learner.toNext} khóa nữa lên "${learner.nextLabel}"` : ' · cấp cao nhất'}
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      {learner.courses.length > 0 && (
        <p className="m-0 mt-2 text-xs text-muted">Đã xong: {learner.courses.slice(0, 3).map(c => c.title).join(', ')}{learner.courses.length > 3 ? '…' : ''}</p>
      )}
      {learner.canMark.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setShowMark(s => !s)} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-blue">
            {showMark ? 'Ẩn' : 'Bé đã học xong một khóa? Bấm "Đã hoàn thành"'}
          </button>
          {showMark && (
            <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
              {learner.canMark.map(c => (
                <li key={c.enrollmentId} className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <button type="button" disabled={busy === c.enrollmentId} onClick={() => onMark(c.enrollmentId)} className="btn btn--green shrink-0 px-3 py-1 text-xs">Đã hoàn thành</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

// Learner tier (plan 21): one row per learner (the account and each child) with the tier by finished courses.
// `learnerId` narrows it to one child (child page).
export default function LearnerTierCard({ learnerId }: { learnerId?: number }) {
  const { token } = useAuth()
  const toast = useToast()
  const [data, setData] = useState<LearnerTierSummary | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(() => { if (token) getLearnerTiers(token).then(setData) }, [token])
  useEffect(() => { load() }, [load])

  if (!data || !data.enabled) return null
  const learners = data.learners.filter(l => learnerId == null || l.learnerId === learnerId)
    .filter(l => learnerId != null || l.finished > 0 || l.canMark.length > 0 || data.learners.length <= 2)
  if (learners.length === 0) return null

  const onMark = async (enrollmentId: number) => {
    if (!token) return
    setBusy(enrollmentId)
    const error = await markCourseFinished(token, enrollmentId)
    setBusy(null)
    if (error) { toast({ kind: 'error', text: error }); return }
    toast({ kind: 'success', text: 'Đã ghi nhận khóa học hoàn thành' })
    nudgeJourneyClaim()
    load()
  }

  return (
    <AccountCard title="Cấp học viên" subtitle={data.tiers.map(t => `${t.icon} ${t.label}`).join(' · ')}>
      <ul className="m-0 list-none p-0">
        {learners.map(l => <Learner key={l.learnerId} learner={l} tiers={data.tiers} onMark={onMark} busy={busy} />)}
      </ul>
    </AccountCard>
  )
}
