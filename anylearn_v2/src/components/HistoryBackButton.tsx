'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@/components/icons'

// Back to the page the person came from; with no history (a pasted link) it goes to `fallbackHref`.
export default function HistoryBackButton({ fallbackHref = '/', children = 'Quay lại' }: { fallbackHref?: string; children?: React.ReactNode }) {
  const router = useRouter()
  return (
    <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref))}
      className="inline-flex min-h-11 cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-sm font-bold text-green-dark hover:underline">
      <ChevronLeftIcon className="-ml-1 size-5" />
      {children}
    </button>
  )
}
