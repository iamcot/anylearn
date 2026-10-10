'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ZALO_OA_URL = 'https://zalo.me/3721021934871748468'

export default function RegisterButton({ itemId }: { itemId: number }) {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [sticky, setSticky] = useState(false)
  const [mounted, setMounted] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setSticky(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleRegister = () => {
    if (user) {
      router.push(`/add2cart/${itemId}`)
    } else {
      openAuthModal('login', () => router.push(`/add2cart/${itemId}`))
    }
  }

  const handleConsult = () => {
    window.open(ZALO_OA_URL, '_blank', 'noopener')
  }

  const stickyBar = sticky ? (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      width: 'min(calc(100vw - 32px), 1180px)',
      background: '#fff',
      boxShadow: '0 -2px 0 0 #e6edf4, 0 8px 32px rgba(15,23,42,0.16)',
      borderRadius: 18,
      padding: '12px 16px',
      display: 'flex', gap: 10,
      zIndex: 1000,
    }}>
      <button onClick={handleConsult}
        className="btn btn--outline"
        style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}>
        Nhận tư vấn
      </button>
      <button onClick={handleRegister}
        className="btn btn--green"
        style={{ flex: 2, padding: '12px 16px', fontSize: 15 }}>
        Đăng ký ngay
      </button>
    </div>
  ) : null

  return (
    <>
      {/* Sentinel: when this scrolls out of view, sticky bar appears */}
      <div ref={sentinelRef} />

      <button onClick={handleRegister} className="btn btn--green" style={{ width: '100%', fontSize: 17, padding: '16px 24px' }}>
        Đăng ký ngay
      </button>
      <button onClick={handleConsult} className="btn btn--outline w-full mt-[10px]">
        Nhận tư vấn miễn phí
      </button>

      {/* Portal: render sticky bar directly into document.body to escape pdp-info-card stacking context */}
      {mounted && createPortal(stickyBar, document.body)}
    </>
  )
}
