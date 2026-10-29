'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkReferral } from '@/lib/api/referral'
import { cleanCode, saveReferral } from '@/lib/referral/store'

// A page opened from a friend's "Mời bạn" link (`?ref={phone}`) keeps the referral like /ref/{phone} does, but the visitor stays
// on the page: the login card there has "Đăng ký ngay", and the register form shows who invited them.
function Capture({ game }: { game: string }) {
  const search = useSearchParams()
  const { user, isAuthLoading } = useAuth()
  const code = cleanCode(search.get('ref'))

  useEffect(() => {
    if (isAuthLoading || user || !code) return
    checkReferral(code).then(result => { if (result.valid) saveReferral(code, result.name, game) })
  }, [code, game, user, isAuthLoading])

  return null
}

export default function RefParamCapture({ game }: { game: string }) {
  return <Suspense fallback={null}><Capture game={game} /></Suspense>
}
