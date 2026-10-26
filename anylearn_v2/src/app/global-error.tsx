'use client'

import { useEffect } from 'react'
import { reloadOnceForNewBuild } from '@/lib/errors/chunkReload'

// Last resort when the root layout itself fails (it replaces the whole page, so it brings its own html and body).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reloadOnceForNewBuild(error) }, [error])

  return (
    <html lang="vi">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '64px 16px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Có lỗi xảy ra</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Trang chưa tải được. Bạn thử tải lại nhé.</p>
        <button type="button" onClick={reset} style={{ padding: '10px 20px', borderRadius: 12, border: 0, background: '#16a34a', color: '#fff', fontWeight: 700 }}>
          Thử lại
        </button>
      </body>
    </html>
  )
}
