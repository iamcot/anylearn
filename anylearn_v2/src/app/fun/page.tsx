'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getFunAccess, getCheckin, type CheckinStatus, type FunAccess } from '@/lib/api/fun'
import FunScene from '@/components/fun/FunScene'
import BrandText from '@/components/fun/BrandText'
import CoinWalletCard from '@/components/fun/CoinWalletCard'
import MyAchievements from '@/components/fun/share/MyAchievements'
import { LEO_NAME, reminderFor } from '@/lib/fun/leo'
import { getLearners, getToday } from '@/lib/today/api'
import { sendDevice } from '@/lib/api/stickers'
import { deviceId } from '@/lib/stickers/device'

export default function FunPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState<CheckinStatus | null>(null)
  const [error, setError] = useState('')
  const [reminder, setReminder] = useState<string | null>(null)
  const [access, setAccess] = useState<FunAccess | null>(null)
  const [childName, setChildName] = useState<string | null>(null)
  const [claims, setClaims] = useState(0)


  useEffect(() => {
    const id = deviceId()
    if (token && id) sendDevice(token, id)
  }, [token])

  useEffect(() => {
    if (!token) return
    getFunAccess(token).then(({ data: a }) => {
      // an old server without the call leaves everything open
      const open = a ?? { checkin: true, quiz: true, sticker: true, explore: true }
      setAccess(open)
      if (!open.checkin) return
      getCheckin(token).then(({ data, error: err }) => {
        if (err || !data) return setError(err ?? 'Không tải được trang Vui học')
        setStatus(data)
      })
    })
  }, [token])

  // Leo also nudges the parent about the next class today, so playing never makes them forget it.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      const { data: learners } = await getLearners(token)
      const active = (learners?.learners ?? []).filter(l => l.hasEnrollment).slice(0, 4)
      if (!cancelled) setChildName((learners?.learners ?? []).find(l => !l.self)?.name ?? null)
      const days = (await Promise.all(active.map(l => getToday(l.id, token)))).flatMap(r => (r.data ? [r.data] : []))
      if (!cancelled) setReminder(reminderFor(days, new Date()))
    })()
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <h1 className="text-2xl font-black lg:text-3xl">Vui học</h1>
      <p className="mt-1 text-sm text-muted">Giải trí nhẹ nhàng cùng <BrandText text={LEO_NAME} /> và nhận {status?.coinName ? <BrandText text={status.coinName} coinName={status.coinName} /> : 'quà'} mỗi ngày.</p>
      {error && <p className="mt-4 text-warn-text">{error}</p>}
      {!error && access?.checkin !== false && !status && <div className="mt-4 h-[250px] animate-pulse rounded-[22px] bg-slate-200" />}
      {status && token && <div className="mt-4"><FunScene token={token} initial={status} reminder={reminder} childName={childName} onClaimed={() => setClaims(n => n + 1)} /></div>}

      {token && status && <CoinWalletCard token={token} refreshKey={claims} />}
      {token && status && <MyAchievements key={claims} token={token} />}

      {access && !access.checkin && !access.quiz && !access.sticker && !access.explore && <p className="mt-4 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Vui học đang thử nghiệm với một nhóm nhỏ, bạn sẽ được chơi sớm thôi!</p>}

      {access?.quiz !== false && <Link href="/fun/quiz" className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-ink no-underline">
        <img src="/fun/leo_rank.png" alt="" className="size-16 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1"><div className="font-bold"><BrandText text="Leo rank" /></div><div className="text-sm text-muted">Trả lời câu hỏi, lên hạng và nhận quà</div></div>
        <span aria-hidden className="text-muted">›</span>
      </Link>}

      {access?.sticker !== false && <Link href="/fun/sticker" className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-ink no-underline">
        <img src="/fun/leo_sticker.png" alt="" className="size-16 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1"><div className="font-bold">Sticker</div><div className="text-sm text-muted">Sưu tầm bộ sticker, đổi với bạn bè và mời bạn nhận quà</div></div>
        <span aria-hidden className="text-muted">›</span>
      </Link>}

      {access?.explore !== false && <Link href="/fun/explore" className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 text-ink no-underline">
        <img src="/fun/leo_discovery.png" alt="" className="size-16 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1"><div className="font-bold">Khám phá</div><div className="text-sm text-muted">Mẹo nuôi dạy con, clip và hình ảnh vui</div></div>
        <span aria-hidden className="text-muted">›</span>
      </Link>}
    </div>
  )
}
