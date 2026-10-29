'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AppTabs from '@/components/AppTabs'
import CompareBar from '@/components/compare/CompareBar'
import { inTodayZone } from '@/lib/today/nav'

const NO_TABS_PREFIXES = ['/join', '/login', '/register', '/forgot-password']

interface Props {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}

export default function SiteChrome({ header, footer, children }: Props) {
  const pathname = usePathname()
  const isToday = inTodayZone(pathname)
  const isJoin = pathname.startsWith('/join')
  const isMap = pathname.startsWith('/search/map')
  // the learning page has its own top bar and bottom bar; the site header stays on a desktop only
  const isLearn = pathname.startsWith('/learn/')
  const showTabs = !isLearn && !NO_TABS_PREFIXES.some(prefix => pathname.startsWith(prefix))
  const needsBodySpace = showTabs && !isToday

  useEffect(() => {
    document.body.classList.toggle('has-app-tabs', needsBodySpace)
    return () => document.body.classList.remove('has-app-tabs')
  }, [needsBodySpace])

  return (
    <>
      {!isJoin && (isLearn ? <div className="max-lg:hidden">{header}</div> : header)}
      <main style={{ flex: 1 }}>{children}</main>
      {!isToday && !isJoin && !isMap && !isLearn && footer}
      <CompareBar />
      {showTabs && <AppTabs />}
    </>
  )
}
