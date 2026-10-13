'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AppTabs from '@/components/AppTabs'

const NO_TABS_PREFIXES = ['/join', '/login', '/register', '/forgot-password']

interface Props {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}

export default function SiteChrome({ header, footer, children }: Props) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isToday = pathname.startsWith('/today')
  const isJoin = pathname.startsWith('/join')
  const showTabs = !!user && !NO_TABS_PREFIXES.some(prefix => pathname.startsWith(prefix))
  const needsBodySpace = showTabs && !isToday

  useEffect(() => {
    document.body.classList.toggle('has-app-tabs', needsBodySpace)
    return () => document.body.classList.remove('has-app-tabs')
  }, [needsBodySpace])

  return (
    <>
      {!isJoin && header}
      <main style={{ flex: 1 }}>{children}</main>
      {!isToday && !isJoin && footer}
      {showTabs && <AppTabs wide={isToday} />}
    </>
  )
}
