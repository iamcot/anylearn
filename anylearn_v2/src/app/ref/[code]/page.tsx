'use client'

import { Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkReferral } from '@/lib/api/referral'
import { cleanCode, cleanGame, saveReferral } from '@/lib/referral/store'

// Landing of a friend's link /ref/{phone}[?game=quiz]: remember who invited the visitor for 30 days, then open registration.
function RefLanding() {
  const { code } = useParams<{ code: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const { user, isAuthLoading } = useAuth()

  useEffect(() => {
    if (isAuthLoading) return
    if (user) { router.replace('/'); return }
    const clean = cleanCode(decodeURIComponent(code))
    const game = cleanGame(search.get('game'))
    let cancelled = false
    ;(async () => {
      if (clean) {
        const result = await checkReferral(clean)
        if (result.valid) saveReferral(clean, result.name, game)
      }
      if (!cancelled) router.replace('/register')
    })()
    return () => { cancelled = true }
  }, [code, search, router, user, isAuthLoading])

  return <p className="py-20 text-center text-muted">Đang mở trang đăng ký...</p>
}

export default function RefPage() {
  return <Suspense fallback={null}><RefLanding /></Suspense>
}
