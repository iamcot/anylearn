'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { markNotificationRead } from '@/lib/api'
import { resolveNotificationRoute } from '@/lib/notifications/route'
import { ListSkeleton } from '@/components/PageSkeleton'

// Where a tapped push notification lands: mark it read, then go to the page it is about.
function OpenNotification() {
  const router = useRouter()
  const search = useSearchParams()
  const { token, isAuthLoading } = useAuth()

  useEffect(() => {
    if (isAuthLoading) return
    const id = Number(search.get('id'))
    const destination = resolveNotificationRoute(search.get('route'), search.get('extra')) ?? '/'
    const markRead = token && id ? markNotificationRead(id, token) : Promise.resolve()
    markRead.finally(() => router.replace(destination))
  }, [isAuthLoading, token, search, router])

  return <Placeholder />
}

function Placeholder() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-8">
      <ListSkeleton />
    </div>
  )
}

export default function NotificationOpenPage() {
  return (
    <Suspense fallback={<Placeholder />}>
      <OpenNotification />
    </Suspense>
  )
}
