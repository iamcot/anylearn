'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { reloadOnceForNewBuild } from '@/lib/errors/chunkReload'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reloadOnceForNewBuild(error) }, [error])

  return (
    <section className="section">
      <div className="container max-w-[520px] text-center">
        <h1 className="mb-3 text-2xl font-black text-ink">Có lỗi xảy ra</h1>
        <p className="mb-6 text-muted">Trang chưa tải được. Bạn thử tải lại hoặc quay về trang chủ nhé.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn--green">Thử lại</button>
          <Link href="/" className="btn btn--outline no-underline">Về trang chủ</Link>
        </div>
      </div>
    </section>
  )
}
