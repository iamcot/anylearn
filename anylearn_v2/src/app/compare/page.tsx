import { Suspense } from 'react'
import type { Metadata } from 'next'
import CompareView from '@/components/compare/CompareView'

export const metadata: Metadata = { title: 'So sánh khóa học | anyLEARN', robots: { index: false } }

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1100px] px-4 py-10 text-muted">Đang tải…</div>}>
      <CompareView />
    </Suspense>
  )
}
