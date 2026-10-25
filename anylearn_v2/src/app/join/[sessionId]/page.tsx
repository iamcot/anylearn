'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getLearners, joinSession } from '@/lib/today/api'
import type { JoinData } from '@/lib/today/types'

const REDIRECT_DELAY_MS = 800

function JoinContent() {
  const { user, token, isAuthLoading } = useAuth()
  const router = useRouter()
  const { sessionId } = useParams<{ sessionId: string }>()
  const search = useSearchParams()
  const [join, setJoin] = useState<JoinData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
  }, [isAuthLoading, user, router])

  useEffect(() => {
    if (!token) return
    async function run(authToken: string) {
      const learnerId = Number(search.get('child')) || (await getLearners(authToken)).data?.defaultLearnerId
      if (!learnerId) return setError('Không tìm thấy người học')
      const { data, error: err } = await joinSession(learnerId, sessionId, authToken)
      if (err || !data) return setError(err ?? 'Không vào được lớp')
      setJoin(data)
      setTimeout(() => window.location.assign(data.url), REDIRECT_DELAY_MS)
    }
    run(token)
  }, [token, sessionId, search])

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-card border border-line bg-white p-6 text-center">
        {error && (
          <>
            <h1 className="text-xl font-black text-ink">Chưa vào lớp được</h1>
            <p className="mt-2 text-muted">{error}</p>
            <Link href="/today" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white">Về Hôm nay</Link>
          </>
        )}
        {!error && !join && <p className="text-muted">Đang kiểm tra và vào lớp...</p>}
        {join && (
          <>
            <h1 className="text-xl font-black text-ink">Đang mở lớp học...</h1>
            {join.meetingId && <p className="mt-3 text-ink">Meeting ID: <strong>{join.meetingId}</strong></p>}
            {join.passcode && <p className="text-ink">Mật khẩu: <strong>{join.passcode}</strong></p>}
            <a href={join.url} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white">Mở Zoom ngay</a>
          </>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinContent />
    </Suspense>
  )
}
