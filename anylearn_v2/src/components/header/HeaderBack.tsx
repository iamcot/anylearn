'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { ChevronLeftIcon } from '@/components/icons'

const subscribeNever = () => () => {}

// Pages that are a tab or the home page, or that already show their own back link: no arrow there.
const ROOTS = ['/', '/today', '/community', '/fun', '/account', '/account/schedule']
const OWN_BACK_PREFIXES = ['/account/', '/community/']

/** Phone header arrow back for pages that have no navigation bar to come back from (the installed app has no browser back button). */
export default function HeaderBack() {
  const pathname = usePathname()
  const router = useRouter()
  const canGoBack = useSyncExternalStore(subscribeNever, () => window.history.length > 1, () => false)
  const isRoot = ROOTS.includes(pathname) || (OWN_BACK_PREFIXES.some(prefix => pathname.startsWith(prefix)) && !ROOTS.includes(pathname))
  if (isRoot || !canGoBack) return null

  return (
    <button type="button" onClick={() => router.back()} aria-label="Quay lại"
      className="-ml-2 grid size-11 shrink-0 cursor-pointer place-items-center border-0 bg-transparent text-ink lg:hidden">
      <ChevronLeftIcon className="size-6" />
    </button>
  )
}
