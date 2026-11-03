'use client'

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getJourney, type Journey, type JourneyChapter } from '@/lib/api/gamification'
import { chapterPercent } from '@/lib/journey/rules'
import { journeyStore, nudgeJourneyClaim } from '@/lib/journey/store'
import AccountCard from '@/components/account/AccountCard'
import BrandText from '@/components/fun/BrandText'
import { CheckIcon, LockIcon } from '@/components/icons'
import { ListSkeleton } from '@/components/PageSkeleton'

function Chapter({ ch, coinName, hasOrder }: { ch: JourneyChapter; coinName: string; hasOrder: boolean }) {
  const pct = chapterPercent(ch)
  return (
    <AccountCard
      title={<span className="flex items-center gap-2">{!ch.open && <LockIcon className="size-4 text-muted" />}Chương {ch.no}: {ch.title}</span>}
      subtitle={`Quà khi xong chương: ${ch.gift}${ch.coins > 0 ? ` + ${ch.coins} ${coinName}` : ''}`}
      action={ch.claimed ? <span className="rounded-full bg-green-soft px-2.5 py-1 text-xs font-extrabold text-green">Đã nhận quà</span>
        : <span className="text-xs font-bold text-muted">{ch.requiredDone}/{ch.required}</span>}>
      {!ch.open && !hasOrder && ch.no >= 4 && (
        <p className="m-0 border-b border-line bg-bg px-5 py-2.5 text-xs text-muted">Mở sau khi bạn đăng ký khóa học đầu tiên.</p>
      )}
      <div className="px-5 pt-3"><div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} /></div></div>
      <ul className="m-0 flex list-none flex-col p-0 pb-1 pt-2">
        {ch.missions.map(m => (
          <li key={m.key} className="flex items-start gap-3 px-5 py-2.5">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${m.done ? 'bg-green text-white' : 'border-2 border-line bg-white'}`}>
              {m.done && <CheckIcon className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-bold ${m.done ? 'text-muted line-through' : 'text-ink'}`}>{m.label}{m.optional && <span className="ml-1 text-xs font-semibold text-muted no-underline">(thêm)</span>}</span>
              {!m.done && <span className="block text-xs text-muted">{m.hint}</span>}
              <span className="block text-xs font-semibold text-green">
                {m.coins > 0 && <BrandText text={`+${m.coins} ${coinName}`} />}{m.sticker && <>{m.coins > 0 ? ' · ' : ''}1 sticker</>}
                {m.done && !m.claimed && ch.open && <span className="ml-1 font-bold text-red">· chờ nhận</span>}
              </span>
            </span>
            {!m.done && ch.open && <Link href={m.route} className="btn btn--outline shrink-0 px-3 py-1.5 text-xs no-underline">Làm</Link>}
          </li>
        ))}
      </ul>
    </AccountCard>
  )
}

export default function JourneyPage() {
  const { token } = useAuth()
  const stored = useSyncExternalStore(journeyStore.subscribe, journeyStore.get, () => null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    nudgeJourneyClaim()
    getJourney(token).then(j => { setJourney(j); setLoading(false) })
  }, [token])

  const view = stored ?? journey
  if (loading && !view) return <div className="rounded-card border border-line bg-white p-5"><ListSkeleton /></div>
  if (!view || !view.enabled) return <p className="rounded-card border border-line bg-white p-5 text-sm text-muted">Hành trình anyLEARN đang tạm đóng.</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-line bg-gradient-to-br from-green-soft to-white p-4">
        <h1 className="m-0 text-xl font-extrabold text-ink">Hành trình anyLEARN</h1>
        <p className="m-0 mt-1 text-sm text-muted">
          Mỗi việc nhỏ giúp bạn tìm lớp hợp với bé. Làm xong là <BrandText text="Leo" /> tặng quà ngay, mỗi việc nhận một lần.
        </p>
      </div>
      {view.chapters.map(ch => <Chapter key={ch.no} ch={ch} coinName={view.coinName} hasOrder={view.hasOrder} />)}
    </div>
  )
}
