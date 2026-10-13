'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getLearners } from '@/lib/today/api'
import { hasAnyEnrollment } from '@/lib/today/learners'
import { clearBrowsing, isBrowsing, markBrowsing, shouldRedirectToToday } from '@/lib/today/links'

export default function TodayRedirect() {
  const { user, token, isAuthLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthLoading) return
    if (!user || !token) return clearBrowsing()
    if (new URLSearchParams(window.location.search).has('browse')) markBrowsing()

    let cancelled = false
    getLearners(token).then(({ data }) => {
      if (cancelled || !data) return
      const state = { enrolled: hasAnyEnrollment(data), browsing: isBrowsing() }
      if (shouldRedirectToToday(state)) router.replace('/today')
    })
    return () => { cancelled = true }
  }, [isAuthLoading, user, token, router])

  return null
}
