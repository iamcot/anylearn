'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

  const stickyBar = sticky ? (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      width: 'min(calc(100vw - 32px), 1180px)',
      background: '#fff',
      boxShadow: '0 -2px 0 0 #e6edf4, 0 8px 32px rgba(15,23,42,0.16)',
      borderRadius: 18,
      padding: '12px 16px',
      display: 'flex', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <button onClick={handleRegister}
        className="btn btn--green"
        style={{
          width: '100%',
          maxWidth: 'min(50%, 480px)',
          padding: '12px 24px', fontSize: 15,
        }}>
        Đăng ký ngay
      </button>
    </div>
  ) : null

  return (
    <>
      <div ref={sentinelRef} />
      <button onClick={handleRegister} className="btn btn--green" style={{ width: '100%', fontSize: 17, padding: '16px 24px' }}>
        Đăng ký ngay
      </button>
      {mounted && createPortal(stickyBar, document.body)}
    </>
  )
}
