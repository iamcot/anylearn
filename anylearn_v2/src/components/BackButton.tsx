'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BackButton() {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    setCanGoBack(window.history.length > 1)
  }, [])

  if (!canGoBack) return null

  return (
    <button
      onClick={() => router.back()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        border: 0, background: 'transparent',
        color: '#6d7a8a', fontWeight: 700, fontSize: 14,
        cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 20px',
      }}
    >
      ← Quay lại
    </button>
  )
}
