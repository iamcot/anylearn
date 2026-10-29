'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getFunAccess, getCheckin, type CheckinStatus, type FunAccess } from '@/lib/api/fun'
import FunScene from '@/components/fun/FunScene'
import BrandText from '@/components/fun/BrandText'
import FunShortcuts from '@/components/fun/FunShortcuts'
import MissionsCard from '@/components/fun/MissionsCard'
import ArenaCustomBanner from '@/components/fun/arena/ArenaCustomBanner'
import ArenaBanner from '@/components/fun/arena/ArenaBanner'
import MyAchievements from '@/components/fun/share/MyAchievements'
import ExploreBrowser from '@/components/fun/explore/ExploreBrowser'
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
      const open = a ?? { checkin: true, quiz: true, sticker: true, explore: true, arena: true }
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

      {token && access && <FunShortcuts access={access} />}
      {token && access?.arena && <ArenaCustomBanner token={token} />}
      {token && access?.arena && <ArenaBanner token={token} />}
      {token && status && access?.checkin !== false && <MissionsCard token={token} refreshKey={claims} onClaimed={() => setClaims(n => n + 1)} />}
      {token && status && <MyAchievements key={claims} token={token} />}

      {access && !access.checkin && !access.quiz && !access.sticker && !access.explore && !access.arena && <p className="mt-4 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Vui học đang thử nghiệm với một nhóm nhỏ, bạn sẽ được chơi sớm thôi!</p>}

      {token && access && access.explore !== false && <ExploreBrowser token={token} />}
    </div>
  )
}
