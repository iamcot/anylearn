'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AppTabs from '@/components/AppTabs'
import CompareBar from '@/components/compare/CompareBar'

const NO_TABS_PREFIXES = ['/join', '/login', '/register', '/forgot-password']

interface Props {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}

export default function SiteChrome({ header, footer, children }: Props) {
  const pathname = usePathname()
  const isToday = pathname.startsWith('/today')
  const isJoin = pathname.startsWith('/join')
  const isMap = pathname.startsWith('/search/map')
  const showTabs = !NO_TABS_PREFIXES.some(prefix => pathname.startsWith(prefix))
  const needsBodySpace = showTabs && !isToday

  useEffect(() => {
    document.body.classList.toggle('has-app-tabs', needsBodySpace)
    return () => document.body.classList.remove('has-app-tabs')
  }, [needsBodySpace])

  return (
    <>
      {!isJoin && header}
      <main style={{ flex: 1 }}>{children}</main>
      {!isToday && !isJoin && !isMap && footer}
      <CompareBar />
      {showTabs && <AppTabs />}
    </>
  )
}
