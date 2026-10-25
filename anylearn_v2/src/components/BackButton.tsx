'use client'

import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { ChevronLeftIcon } from '@/components/icons'

const subscribeNever = () => () => {}

export default function BackButton() {
  const router = useRouter()
  const canGoBack = useSyncExternalStore(subscribeNever, () => window.history.length > 1, () => false)

  if (!canGoBack) return null

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-2 inline-flex min-h-11 cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-sm font-bold text-muted hover:text-blue"
    >
      <ChevronLeftIcon className="-ml-1 size-5" />
      Quay lại
    </button>
  )
}
